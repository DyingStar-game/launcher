# Politique de sécurité

## Versions prises en charge

Les correctifs de sécurité sont appliqués sur la dernière release et la branche principale, avec backport au jugement des mainteneurs.

| Version              | Support         |
| -------------------- | --------------- |
| Dernière release     | Oui             |
| Versions antérieures | Meilleur effort |

## Signaler une vulnérabilité

**Ne pas ouvrir d’issue GitHub publique pour une vulnérabilité.**

Envoyer un e-mail à **contact@dyingstar-game.com** avec :

- Description et impact
- Étapes de reproduction
- Versions ou commits concernés
- PoC éventuel

Accusé de réception sous quelques jours ouvrés ; coordination de la divulgation après correctif.

## Périmètre spécifique au launcher

- Accès disque pour l’installation du jeu — n’installer que dans des dossiers de confiance.
- Jetons OAuth stockés localement par environnement — protéger le profil utilisateur sur machine partagée.
- Les variables `VITE_*` sont incluses dans le binaire — **jamais** de secrets avec ce préfixe.
- Le lore est du markdown embarqué ; pas de chargement markdown distant non fiable en prod aujourd’hui.

## Bonnes pratiques contributeurs

- `VITE_ENABLE_DEVTOOLS=false` pour les builds release
- Ne pas committer `.env`, jetons ou clés privées
- Vérifier le path traversal sur les handlers IPC touchant le filesystem
