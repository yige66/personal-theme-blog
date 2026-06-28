import Link from 'next/link';

const navItems = [
  { href: '/projects', label: '项目' },
  { href: '/archive', label: '归档' },
  { href: '/gallery', label: '照片墙' },
  { href: '/music', label: '音乐' },
  { href: '/moments', label: '说说' },
  { href: '/tags', label: '标签' },
  { href: '/links', label: '友链' },
  { href: '/about', label: '关于' },
  { href: '/console', label: '发布' }
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
