import { Diamond } from 'lucide-react';
import styles from './FeaturedMembers.module.css';

const members = [
  {
    id: '1',
    name: 'CodeWizard',
    points: '2.450',
    avatar: '/assets/avatars/avatar1.png',
  },
  {
    id: '2',
    name: 'PixelMage',
    points: '1.980',
    avatar: '/assets/avatars/avatar2.png',
  },
  {
    id: '3',
    name: 'LoreMaster',
    points: '1.750',
    avatar: '/assets/avatars/avatar3.png',
  },
  {
    id: '4',
    name: 'DataHunter',
    points: '1.620',
    avatar: '/assets/avatars/avatar4.png',
  },
];

export const FeaturedMembers = () => {
  return (
    <div className={styles.container}>
      <div className={styles.membersCard}>
        <h2 className={styles.title}>MIEMBROS DESTACADOS</h2>

        <div className={styles.membersList}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberItem}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatarFallback}>{member.name.charAt(0)}</div>
              </div>

              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.name}</span>
                <div className={styles.pointsWrapper}>
                  <span className={styles.points}>{member.points} puntos</span>
                  <Diamond size={14} className={styles.diamondIcon} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.quoteCard}>
        <p className={styles.quoteText}>
          &quot;En este foro, cada aporte es una semilla. Juntos construimos conocimiento, juntos
          somos leyenda.&quot;
        </p>
        <div className={styles.campfireWrapper}>
          <span className={styles.campfire}>🔥</span>
        </div>
      </div>
    </div>
  );
};
