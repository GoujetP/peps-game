pipeline {
    agent any

    environment {
        // --- CONFIGURATION ---
        // Noms des images Docker que nous allons créer
        SERVER_IMAGE = "peps-game-server"
        CLIENT_IMAGE = "peps-game-client"
        
        // Le réseau Docker créé lors de l'installation de Jenkins/Sonar
        // Cela permet au Back de parler à la base de données si besoin
        NETWORK_NAME = "cicd-net" 
        
        // Ports exposés sur le VPS
        SERVER_PORT = "3000"
        CLIENT_PORT = "80"
    }

    stages {
        // --- ETAPE 1 : BUILD DU BACKEND (NestJS) ---
        stage('Build Backend') {
            steps {
                script {
                    echo '📦 Construction de l\'image Docker Server...'
                    // On va dans le dossier server pour construire
                    sh "docker build -t ${SERVER_IMAGE} ./server"
                }
            }
        }

        // --- ETAPE 2 : DEPLOIEMENT DU BACKEND ---
        stage('Deploy Backend') {
            steps {
                script {
                    echo '🚀 Déploiement du Server...'
                    // 1. Arrêter le conteneur s'il tourne déjà (|| true évite l'erreur si c'est la 1ere fois)
                    sh "docker stop ${SERVER_IMAGE} || true"
                    // 2. Supprimer l'ancien conteneur
                    sh "docker rm ${SERVER_IMAGE} || true"
                    // 3. Lancer le nouveau
                    sh """
                        docker run -d \
                        --name ${SERVER_IMAGE} \
                        --network ${NETWORK_NAME} \
                        --restart unless-stopped \
                        -p ${SERVER_PORT}:3000 \
                        ${SERVER_IMAGE}
                    """
                }
            }
        }

        // --- ETAPE 3 : BUILD DU FRONTEND (Angular) ---
        stage('Build Frontend') {
            steps {
                script {
                    echo '📦 Construction de l\'image Docker Client...'
                    sh "docker build -t ${CLIENT_IMAGE} ./client"
                }
            }
        }

        // --- ETAPE 4 : DEPLOIEMENT DU FRONTEND ---
        stage('Deploy Frontend') {
            steps {
                script {
                    echo '🚀 Déploiement du Client HTTPS...'
                    sh "docker stop ${CLIENT_IMAGE} || true"
                    sh "docker rm ${CLIENT_IMAGE} || true"
                    
                    // Remplace 'peps-game.duckdns.org' par TON VRAI DOMAINE partout ci-dessous 👇
                    sh """
                        docker run -d \
                        --name ${CLIENT_IMAGE} \
                        --network ${NETWORK_NAME} \
                        --restart unless-stopped \
                        -p 80:80 \
                        -p 443:443 \
                        -v /etc/letsencrypt/live/peps-game.duckdns.org/fullchain.pem:/etc/letsencrypt/live/peps-game.duckdns.org/fullchain.pem:ro \
                        -v /etc/letsencrypt/live/peps-game.duckdns.org/privkey.pem:/etc/letsencrypt/live/peps-game.duckdns.org/privkey.pem:ro \
                        -v /etc/letsencrypt/archive:/etc/letsencrypt/archive:ro \
                        ${CLIENT_IMAGE}
                    """
                }
            }
        }
    }

    // --- NETTOYAGE APRES COUP ---
    post {
        always {
            // Nettoie les images "dangling" (les vieilles versions inutiles) pour ne pas saturer le disque
            sh "docker image prune -f"
        }
        success {
            echo '✅ Déploiement complet terminé avec succès !'
        }
        failure {
            echo '❌ Le déploiement a échoué.'
        }
    }
}