#!/usr/bin/env python3
# Сборка сайта: python3 build.py  →  папка dist/ (её и выкладываем в сеть).
# Что и в каком порядке попадает на сайт, задаётся в site.json.
import html
import json
import os
import re
import shutil
import subprocess
import sys

root = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(root, 'src')
dist = os.path.join(root, 'dist')
warnings = []


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(text)


def is_on(item):
    return not item.get('off', False)


def badge_html(cfg, key, short):
    if not key:
        return ''
    names = cfg.get('badges', {}).get(key)
    if not names:
        return ''
    label = names[1] if short and len(names) > 1 else names[0]
    return ' <span class="srcb ' + key + '">' + html.escape(label) + '</span>'


def card_attrs(card_html):
    head = re.match(r'<article\b([^>]*)>', card_html)
    if not head:
        return {}
    attrs = {}
    for m in re.finditer(r'(id|data-d|data-t|data-p)="([^"]*)"', head.group(1)):
        attrs[m.group(1)] = m.group(2)
    return attrs


def load_sections(cfg):
    out = []
    for sec in cfg['sections']:
        if not is_on(sec):
            continue
        folder = os.path.join(src, sec['folder'])
        cards = []
        for card in sec.get('cards', []):
            if not is_on(card):
                continue
            path = os.path.join(folder, card['file'])
            if not os.path.exists(path):
                warnings.append('нет файла карточки: ' + os.path.relpath(path, root))
                continue
            body = read(path).strip()
            cards.append({'cfg': card, 'html': body, 'attrs': card_attrs(body)})
        intro = read(os.path.join(folder, sec['intro'])).strip() if sec.get('intro') else ''
        outro = read(os.path.join(folder, sec['outro'])).strip() if sec.get('outro') else ''
        photos = read(os.path.join(folder, sec['photos'])).strip() if sec.get('photos') else ''
        intro = (intro + '\n' + photos).strip()
        if not cards and not intro:
            continue
        out.append({'cfg': sec, 'cards': cards, 'intro': intro, 'outro': outro})
    return out


def render_sections(cfg, sections):
    parts = []
    for s in sections:
        sec = s['cfg']
        head = '<div class="block-h" id="' + sec['id'] + '"><span class="roman">' + sec['roman'] + '</span><h2>' + sec['title'] + '</h2>'
        head += badge_html(cfg, sec.get('badge'), False).strip()
        head += '<span class="sub">' + sec.get('sub', '') + '</span></div>'
        parts.append(head)
        if s['intro']:
            parts.append(s['intro'])
        parts.append('<div class="cards">')
        for c in s['cards']:
            parts.append(c['html'])
            parts.append('')
        parts.append('</div><!-- /cards ' + sec['roman'] + ' -->')
        if s['outro']:
            parts.append(s['outro'])
        parts.append('')
    return '\n'.join(parts)


def render_toc(cfg, sections):
    rows = ['<nav class="toc" aria-label="Оглавление">', '  <details open id="toc-details">', '    <summary>Оглавление</summary>']
    if cfg.get('cheatsheet', True):
        rows.append('    <div class="grp">Шпаргалка</div>')
        rows.append('    <ol>')
        rows.append('      <li><a href="#cheat"><span class="n">★</span><span>Всё одной цепочкой</span><span class="k"></span></a></li>')
        rows.append('    </ol>')
    for s in sections:
        sec = s['cfg']
        items = [c for c in s['cards'] if c['cfg'].get('toc')]
        if not items:
            continue
        rows.append('    <div class="grp">' + sec['roman'] + ' · ' + html.escape(sec.get('toc', sec['title'])) + badge_html(cfg, sec.get('badge'), True) + '</div>')
        rows.append('    <ol>')
        for c in items:
            a = c['attrs']
            data = ''
            for key in ('data-d', 'data-t', 'data-p'):
                if key in a:
                    data = ' ' + key + '="' + a[key] + '"'
                    break
            n = html.escape(c['cfg'].get('toc_n', ''))
            label = html.escape(c['cfg']['toc'])
            rows.append('      <li' + data + '><a href="#' + a.get('id', '') + '"><span class="n">' + n + '</span><span>' + label + '</span><span class="k"></span></a></li>')
        rows.append('    </ol>')
    rows.append('  </details>')
    rows.append('</nav>')
    return '\n'.join(rows)


def render_hero_links(cfg, sections, ids):
    links = []
    for item in cfg.get('hero_extra_links', []):
        if len(item) > 2 and item[2] == 'first':
            links.append((item[0], item[1]))
    for s in sections:
        if s['cfg'].get('hero'):
            target = '#' + s['cfg']['id']
            if s['cfg']['roman'] == 'I' and s['cards']:
                target = '#' + s['cards'][0]['attrs'].get('id', s['cfg']['id'])
            links.append((target, s['cfg']['hero']))
    for item in cfg.get('hero_extra_links', []):
        if not (len(item) > 2 and item[2] == 'first'):
            links.append((item[0], item[1]))
    body = ''.join('<a href="' + h + '">' + html.escape(t) + '</a>' for h, t in links if h[1:] in ids)
    return '<nav class="hero-links" aria-label="Разделы">' + body + '</nav>'


def fix_dead_links(page):
    ids = set(re.findall(r'\bid="([^"]+)"', page))

    def repl(m):
        target = m.group(2)
        if target in ids:
            return m.group(0)
        dead[target] = dead.get(target, 0) + 1
        return '<span class="gone">' + m.group(4) + '</span>'
    dead = {}
    page = re.sub(r'<a\b([^>]*?)href="#([^"]+)"([^>]*)>(.*?)</a>', repl, page, flags=re.S)
    for target in sorted(dead):
        warnings.append('ссылки на убранную часть #' + target + ': ' + str(dead[target]) + ' шт., заменены зачёркнутым текстом')
    return page


def bundle_js():
    jsdir = os.path.join(src, 'js')
    names = sorted(n for n in os.listdir(jsdir) if n.endswith('.js'))
    chunks = ['(function(){', '"use strict";']
    for n in names:
        chunks.append('/* ===== ' + n + ' ===== */')
        chunks.append(read(os.path.join(jsdir, n)).rstrip())
    chunks.append('})();')
    return '\n'.join(chunks) + '\n'


def main():
    cfg = json.loads(read(os.path.join(root, 'site.json')))
    sections = load_sections(cfg)
    hero = read(os.path.join(src, 'partials', 'hero.html'))
    cheat = read(os.path.join(src, 'partials', 'cheatsheet.html')) if cfg.get('cheatsheet', True) else ''
    notes = read(os.path.join(src, 'partials', 'intro-notes.html')) if cfg.get('intro_notes', True) else '<section id="ticket-panel" class="ticket-panel" hidden aria-live="polite"></section>'
    head_extra = read(os.path.join(src, 'partials', 'head-extra.html'))
    title = html.escape(cfg.get('title', 'Сайт'))
    desc = html.escape(cfg.get('description', ''))
    robots = '<meta name="robots" content="noindex, nofollow">\n' if cfg.get('noindex') else ''
    icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%232547BF'/%3E%3Cpath d='M6 9c6 0 7 15 10 15s4-15 10-15' fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round'/%3E%3C/svg%3E"
    theme_boot = "<script>try{var t=localStorage.getItem('optdefs-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>"
    head = '\n'.join([
        '<!doctype html>',
        '<html lang="' + cfg.get('lang', 'ru') + '">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        '<title>' + title + '</title>',
        '<meta name="description" content="' + desc + '">',
        robots.rstrip('\n'),
        '<meta property="og:title" content="' + title + '">',
        '<meta property="og:description" content="' + desc + '">',
        '<meta property="og:type" content="website">',
        '<link rel="icon" href="' + icon + '">',
        head_extra.rstrip('\n'),
        theme_boot,
        '{{CSS}}',
        '</head>',
        '<body>'
    ])
    body = '\n'.join([
        hero,
        '<div class="page">',
        render_toc(cfg, sections),
        '',
        '<main>',
        cheat,
        notes,
        render_sections(cfg, sections),
        '</main>',
        '</div><!-- /page -->',
        '',
        '<footer class="end">' + cfg.get('footer', '') + '</footer>',
        '{{JS}}',
        '</body>',
        '</html>'
    ])
    page = head + '\n' + body + '\n'
    ids = set(re.findall(r'\bid="([^"]+)"', page))
    page = page.replace('{{HERO_LINKS}}', render_hero_links(cfg, sections, ids))
    page = fix_dead_links(page)
    css = read(os.path.join(src, 'css', 'style.css'))
    js = bundle_js()
    if os.path.exists(dist):
        shutil.rmtree(dist)
    os.makedirs(os.path.join(dist, 'assets'))
    write(os.path.join(dist, 'assets', 'style.css'), css)
    write(os.path.join(dist, 'assets', 'app.js'), js)
    write(os.path.join(dist, 'index.html'), page.replace('{{CSS}}', '<link rel="stylesheet" href="assets/style.css">').replace('{{JS}}', '<script src="assets/app.js"></script>'))
    write(os.path.join(dist, 'standalone.html'), page.replace('{{CSS}}', '<style>\n' + css + '</style>').replace('{{JS}}', '<script>\n' + js.replace('</script', '<\\/script') + '</script>'))
    write(os.path.join(dist, '.nojekyll'), '')
    img = os.path.join(root, 'img')
    if os.path.isdir(img):
        shutil.copytree(img, os.path.join(dist, 'img'))
    try:
        res = subprocess.run(['node', '--check', os.path.join(dist, 'assets', 'app.js')], capture_output=True, text=True)
        if res.returncode != 0:
            warnings.append('ошибка синтаксиса JS:\n' + res.stderr)
    except FileNotFoundError:
        pass
    n_cards = sum(len(s['cards']) for s in sections)
    print('готово: dist/index.html — разделов ' + str(len(sections)) + ', карточек ' + str(n_cards))
    for w in sorted(set(warnings)):
        print('  внимание: ' + w)
    if any(w.startswith('ошибка синтаксиса') for w in warnings):
        sys.exit(1)


if __name__ == '__main__':
    main()
