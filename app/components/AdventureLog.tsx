import styles from '@styles/components/AdventureLog.module.scss';
import type { ReactElement } from 'react';

export default function AdventureLog({
  logs = []
}: { logs: string[] }): ReactElement {
  return (
    <div className={styles.container}>
      {logs.map((log, i) => {
        <p key={i}>{log}</p>
      })}
    </div>
  );
}