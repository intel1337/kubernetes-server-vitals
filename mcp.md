# Contexte développeur & projet — Tae

## Profil

- 19 ans, développeur full-stack freelance, niveau confirmé (2-5 ans d'expérience)
- Objectif : devenir DevOps
- Formation : DWWM (bac+2), puis admis en MSc ingénierie du web (bac+4/5), interrompu en cours d'année
- A fait une pause de dev d'1,5 an, se remet dedans progressivement pour éviter de dépendre du vibe coding, avec l'objectif d'être prêt pour la rentrée
- Expérience pro : 2 stages d'1 mois, 4 mois d'alternance en startup IA (aide à l'architecture, patchs MySQL)

## Stack technique

**Niveaux par langage**
- JavaScript : très bonne expérience
- TypeScript : expérience moyenne
- Python : expérience débutante
- C : expérience débutante (Linux / Mac ARM)
- Java : petite expérience
- C++ : petite expérience (reverse engineering sous Windows)
- Go : touché, sans plus de détail

**Très bonne maîtrise**
- Prisma
- Next.js (très solide, mais doit réapprendre les server actions et le SEO, oubliés depuis)
- Docker (à l'aise, mais doit se remettre à niveau sur compose et les Dockerfiles, oubliés depuis)

**Frameworks/outils touchés (niveaux variables, souvent notions)**
- Front : React, Svelte, Angular, Vue, Nuxt — n'aime pas trop le frontend (a du mal avec les règles CSS, mauvais avec Tailwind), mais très satisfait quand il réussit un front réussi par lui-même
- Back : Nest.js (bases), Express/Node.js, ASP.NET 8 (bases), Spring Boot (toutes petites bases), Django/DRF (bases), Flask, FastAPI
- C : a fait un serveur HTTP fait main
- BDD : PostgreSQL (via Prisma), MySQL, ORM SQL fait main (appris en master), Redis (notions seulement avant ce projet)
- Infra : Kubernetes (bases solides via minikube + notions prod via Digital Ocean, à revoir), Vercel (maîtrise parfaite), VPS classique (à l'aise mais manque de notions sécurité/bonnes pratiques), AWS (notions IAM), Digital Ocean/S3 (expérience en entreprise), Appwrite
- Réseau/CI-CD : Git, GitLab, GitHub, débuts de CI/CD, reverse proxy, Nginx, Cloudflare, CronJobs K8s (expérience pro, utilisés pour lancer des spiders et du scraping de data)

**Reverse engineering**
- Notions solides : dump mémoire, analyse de protections, retrouver une adresse contenant un objet puis l'objet, IDA (notions sur le .text, la mémoire, les offsets), MITM, certificats

**Parcours d'apprentissage**
- En master (MSc ingénierie du web) : a appris à faire un Redis maison et un ORM SQL en Node.js, ainsi que les bases de Nest.js et Vue/Nuxt

**Environnement**
- Éditeur : VS Code
- OS : Windows (avec Docker Desktop + WSL2)

## Workflow & préférences de travail

- Git : en pro branches + PR + issues + review, CI/actions basique si possible ; en perso commits directs par sécurité
- Tests automatisés : rarement/jamais
- Linting : ESLint de base en général (juste assez pour build sans être trop strict), sauf projet important ou langage strict où c'est plus poussé

**Préférences de communication**
- Préfère discuter pour poser les bases, puis avoir des exemples de code courts et directs ; si incompréhension, comparaison avec des éléments réels
- Veut être challengé franchement si une approche technique proposée n'est pas bonne
- Commentaires dans le code : modulés selon la complexité
- Aime le code structuré, qu'il comprend et peut coder lui-même ; aime les design patterns et la propreté de codebase à condition de les comprendre/connaître
- À l'aise avec les termes anglais/franglais dans les échanges techniques
- Aime le reverse engineering, le DevOps, le développement backend ; n'aime pas trop le frontend
- But actuel : approfondir plusieurs domaines techniques plutôt que rester focalisé sur Next.js seul

---

## Projet en cours : Dashboard de monitoring auto-hébergé

**Objectif du projet** : reconstruire en mini-version ce que font Grafana/Prometheus/UptimeRobot, pour comprendre les mécanismes plutôt que consommer un outil tout fait — remise à niveau avant la rentrée sur Next.js, Docker, K8s, Redis en pratique.

### Architecture cible

- **3 serveurs Express "decoys"** containerisés : decoy-a, decoy-b (stables), decoy-c (défectueux — délai aléatoire + 20% de chance d'erreur 500)
- **Backend Nest** : health-checks HTTP réguliers sur chaque decoy, stockage en Postgres (historique/logs), cache Redis (dernier état connu)
- **Front Next.js** : dashboard avec shadcn/ui, server actions plutôt que components/useEffect pour rester léger. Overview des services + détail par service + formulaire d'ajout (server action) + page de statut publique (exercice SEO/metadata)
- Pas de déploiement Digital Ocean pour ce projet — tout reste local/self-hosted

### Infrastructure K8s

- Cluster **kind** (via Docker Desktop, provisioning method "kind") — pas minikube, pour avoir du multi-node
- **4 nodes** : 1 control-plane (intouchable, taint par défaut) + 3 workers labellisés :
  - `role=decoys` → les 3 serveurs Express
  - `role=app` → Next + Nest
  - `role=data` → Postgres + Redis (isolé du reste, bonne pratique stateful/stateless)
- Machine : i9-10900k, 32 Go RAM
- Images buildées en local puis **pushées sur Docker Hub** (l'import manuel via `docker save`/`ctr import` a été tenté puis abandonné, trop chronophage) — en conditions réelles, prévoit image privée + secret K8s (`imagePullSecrets`)

### Cron / scheduling

- Distinction posée entre scheduler in-app (`@nestjs/schedule`, granularité seconde, pour le polling fréquent des health-checks) et **CronJob K8s natif** (granularité minute, pour tâches type batch)
- Plan : scheduler in-app pour les health-checks dès le début, CronJob K8s ajouté vers la fin du projet pour une tâche adaptée (ex. purge des logs de plus de 7 jours) — retrouve un usage déjà connu en entreprise (lancement de spiders/scraping)

### Avancement actuel

- ✅ Cluster kind à 4 nodes opérationnel, nodes labellisés
- ✅ 3 serveurs Express (decoys) écrits, dont le decoy instable (delay random via `GetFloatEntropy() * 300` env.)
- ✅ Dockerfiles des 3 decoys + `build.bat` pour automatiser les builds
- ✅ Images pushées sur Docker Hub, pods `Running` sur le node `decoys`, Services ClusterIP créés et vérifiés (`decoy-a`, `decoy-b`, `decoy-c`)
- 🔄 Module Nest `health-check` en cours (controller + service) :
  - Bug résolu : `forEach` async → remplacé par `map` + `Promise.all`
  - Bug résolu : gestion d'erreur par cible (try/catch individuel dans le `map` pour éviter qu'une cible down fasse échouer tout `Promise.all`)
  - En cours : setup `.env.local` + `ConfigModule` pour gérer les URLs des decoys différemment entre dev local (via `kubectl port-forward`, ports 3001-3003) et cluster (DNS interne K8s, `http://decoy-a:3000`)

### Prochaines étapes prévues

1. Finaliser `HealthCheckService` (fetch + gestion d'erreur par cible) + `@Cron` pour le polling automatique
2. Exposer `GET /healthcheck` qui lit le dernier état connu (pas de nouveau fetch à chaque appel)
3. Containeriser Postgres + Redis sur le node `data`, setup Prisma sur Nest
4. Construire le dashboard Next.js (shadcn + server actions)
5. Ingress (à apprendre — remplace le NodePort pour l'exposition)
6. CronJob K8s (vers la fin du projet)