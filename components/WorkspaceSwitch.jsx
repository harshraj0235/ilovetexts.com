import Link from 'next/link';
import styles from './WorkspaceSwitch.module.css';

export default function WorkspaceSwitch({ active = 'tools', lang = 'en' }) {
  const home = lang === 'en' ? '/' : `/${lang}`;
  return (
    <div className={styles.wrap}>
      <nav className={styles.switch} aria-label="Choose your workspace">
        <Link href={home} aria-current={active === 'tools' ? 'page' : undefined}>Free Tools</Link>
        <Link href="/workflows" aria-current={active === 'workflows' ? 'page' : undefined}>Workflows</Link>
      </nav>
    </div>
  );
}
