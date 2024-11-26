# README du Projet

## Système de Gestion de Devoirs

Ce projet est une application web de gestion de devoirs, développée avec React, TypeScript et Vite. L'application permet aux utilisateurs de créer, gérer et suivre leurs devoirs, tout en offrant une interface utilisateur intuitive et réactive.

### Fonctionnalités Principales

- **Authentification des Utilisateurs** : Les utilisateurs peuvent se connecter et s'inscrire avec un nom d'utilisateur et un code PIN.
- **Gestion des Devoirs** : Les utilisateurs peuvent créer, modifier et supprimer des devoirs. Chaque devoir peut avoir un titre, une description, une matière, une date limite et des cibles spécifiques (groupes ou utilisateurs).
- **Vue Calendrier et Timeline** : Les utilisateurs peuvent visualiser leurs devoirs dans un calendrier ou une timeline, facilitant ainsi la gestion de leurs tâches.
- **Rôles Utilisateurs** : Les utilisateurs peuvent avoir différents rôles (utilisateur ou administrateur), ce qui permet une gestion des utilisateurs et des devoirs plus flexible.

### Technologies Utilisées

- **React** : Pour la construction de l'interface utilisateur.
- **TypeScript** : Pour une meilleure gestion des types et une réduction des erreurs.
- **Vite** : Comme outil de construction et de développement.
- **Supabase** : Pour la gestion de la base de données et l'authentification.
- **Tailwind CSS** : Pour le style et la mise en page.

### Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/systeme-gestion-devoirs.git
   ```

2. Accédez au répertoire du projet :
   ```bash
   cd systeme-gestion-devoirs
   ```

3. Installez les dépendances :
   ```bash
   npm install
   ```

4. Configurez les variables d'environnement pour Supabase dans un fichier `.env` :
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Démarrez le serveur de développement :
   ```bash
   npm run dev
   ```

### Contribuer

Pour contribuer à ce projet, veuillez suivre ces étapes :

1. Forkez le dépôt.
2. Créez une nouvelle branche :
   ```bash
   git checkout -b ma-nouvelle-fonctionnalité
   ```

3. Apportez vos modifications et validez-les :
   ```bash
   git commit -m "Ajout d'une nouvelle fonctionnalité"
   ```

4. Poussez vos modifications :
   ```bash
   git push origin ma-nouvelle-fonctionnalité
   ```

5. Ouvrez une Pull Request.

### License

Ce projet est sous licence MIT. Consultez le fichier `LICENSE` pour plus de détails.