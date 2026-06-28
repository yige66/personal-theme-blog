import Link from 'next/link';

const navItems = [
  { href: '/archive', label: '归档' },
  { href: '/tags', label: '标签' },
  { href: '/projects', label: '项目' },
  { href: '/music', label: '音乐' },
  { href: '/gallery', label: '相册' },
  { href: '/moments', label: '动态' },
  { href: '/links', label: '友链' },
  { href: '/about', label: '关于' },
  { href: '/console', label: '控制台' }
];

export function SiteNav({ title }: { title: string }) {
  return (
    <nav className="top-nav site-nav" aria-label="主导航">
      <Link className="brand" href="/">{title}</Link>
      <div>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </div>
    </nav>
  );
}
