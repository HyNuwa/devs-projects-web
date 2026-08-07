'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AtSign,
  Calendar,
  Camera,
  Mail,
  Pencil,
  Save,
  Shield,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Button, Input, useToast } from '@/components/ui';
import styles from './ProfilePage.module.css';

const ROLE_LABELS: Record<string, string> = {
  VISITOR: 'Visitante',
  USER: 'Estudiante',
  MODERATOR: 'Moderador',
  ADMIN: 'Administrador',
  SUPERADMIN: 'Super Admin',
};

const BIO_MAX_LENGTH = 500;

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setIsEditing(true);
  };

  // Revoke object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await api.patch('/users/me', {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
      });
      addToast('Perfil actualizado', 'success');
      await checkAuth();
      setIsEditing(false);
    } catch {
      addToast('Error al actualizar el perfil', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Selecciona un archivo de imagen válido', 'error');
      return;
    }

    setAvatarFile(file);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;

    setIsSavingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);
      await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Avatar actualizado', 'success');
      await checkAuth();
      resetAvatar();
    } catch {
      addToast('Error al actualizar el avatar', 'error');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const resetAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const memberSince = user
    ? new Date(user.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.headerBadge}>
              <Sparkles size={16} />
              <span className={`${styles.headerLabel} font-pixel`}>PERFIL</span>
              <Sparkles size={16} />
            </div>
            <h1 className={`${styles.title} font-pixel`}>FICHA DE AVENTURERO</h1>
            <p className={styles.subtitle}>Gestiona tu identidad en DevsProject</p>
          </header>

          {user && (
            <div className={styles.grid}>
              {/* Avatar card */}
              <section className={`${styles.card} ${styles.avatarCard}`}>
                <div className={styles.avatarFrame}>
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={`Avatar de ${user.username}`}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.avatarEditBtn}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Cambiar avatar"
                  >
                    <Camera size={16} />
                    Cambiar avatar
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={handleAvatarChange}
                />

                {avatarPreview && (
                  <div className={styles.avatarActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isSavingAvatar}
                      leftIcon={<Upload size={16} />}
                      onClick={handleSaveAvatar}
                    >
                      Guardar avatar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<X size={16} />}
                      onClick={resetAvatar}
                      disabled={isSavingAvatar}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                <div className={styles.identity}>
                  <h2 className={styles.username}>{user.displayName || user.username}</h2>
                  <span className={styles.roleBadge}>
                    <Shield size={14} />
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>

                <div className={styles.memberSince}>
                  <Calendar size={14} />
                  <span>Miembro desde {memberSince}</span>
                </div>
              </section>

              {/* Details card */}
              <section className={`${styles.card} ${styles.detailsCard}`}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Datos del personaje</h2>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil size={16} />}
                      onClick={startEditing}
                    >
                      Editar perfil
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className={styles.form}>
                    <Input
                      label="Nombre visible"
                      placeholder="Cómo te llaman en la comunidad"
                      value={displayName}
                      maxLength={50}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />

                    <div className={styles.field}>
                      <label htmlFor="profile-bio" className={styles.fieldLabel}>
                        Biografía
                      </label>
                      <textarea
                        id="profile-bio"
                        className={styles.textarea}
                        placeholder="Cuéntanos quién eres, qué estudias, tus intereses..."
                        value={bio}
                        maxLength={BIO_MAX_LENGTH}
                        onChange={(event) => setBio(event.target.value)}
                      />
                      <span className={styles.charCount}>
                        {bio.length}/{BIO_MAX_LENGTH}
                      </span>
                    </div>

                    <div className={styles.formActions}>
                      <Button
                        variant="primary"
                        isLoading={isSavingProfile}
                        leftIcon={<Save size={16} />}
                        onClick={handleSaveProfile}
                      >
                        Guardar cambios
                      </Button>
                      <Button
                        variant="ghost"
                        leftIcon={<X size={16} />}
                        onClick={() => setIsEditing(false)}
                        disabled={isSavingProfile}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.infoList}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <AtSign size={18} />
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Usuario</div>
                        <div className={styles.infoValue}>@{user.username}</div>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <Mail size={18} />
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Email</div>
                        <div className={styles.infoValue}>{user.email}</div>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <Pencil size={18} />
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Biografía</div>
                        {user.bio ? (
                          <div className={styles.infoValue}>{user.bio}</div>
                        ) : (
                          <div className={`${styles.infoValue} ${styles.bioEmpty}`}>
                            Aún no has escrito una biografía. ¡Preséntate a la comunidad!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
