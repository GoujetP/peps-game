pipeline {
    agent any

    environment {
        // --- CONFIGURATION DOCKER ---
        SERVER_IMAGE = "peps-game-server"
        CLIENT_IMAGE = "peps-game-client"
        NETWORK_NAME = "cicd-net" 
        
        SERVER_PORT = "3000"
        CLIENT_PORT = "80"

        // --- CONFIGURATION SONAR ---
        SONAR_ORG = "sonarqube-goujetp"
        SONAR_PROJECT_KEY_SERVER = "peps-game-backend"
        SONAR_PROJECT_KEY_CLIENT = "peps-game-frontend"
    }

    // J'AI SUPPRIMÉ LE BLOC 'TOOLS' QUI POSAIT PROBLÈME
    
    stages {
        // --------------------------------------------------------
        // ANALYSE DU BACKEND (SERVER)
        // --------------------------------------------------------
        stage('SonarQube Analysis - Server') {
            steps {
                script {
                    // 1. On récupère le chemin de l'outil ici (C'est la méthode infaillible)
                    // Assure-toi que le nom 'sonar-scanner' est bien celui dans Administrer Jenkins > Tools
                    def scannerHome = tool 'sonar-scanner'
                    
                    withSonarQubeEnv('SonarCloud') {
                        // 2. On utilise le chemin complet vers l'exécutable
                        sh """
                            "${scannerHome}/bin/sonar-scanner" \
                            -Dsonar.organization=${SONAR_ORG} \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY_SERVER} \
                            -Dsonar.sources=server \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/*.spec.ts \
                            -Dsonar.tests=server \
                            -Dsonar.test.inclusions=**/*.spec.ts \
                            -Dsonar.javascript.lcov.reportPaths=server/coverage/lcov.info
                        """
                    }
                }
            }
        }

        stage('Quality Gate - Server') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // --------------------------------------------------------
        // BUILD & DEPLOY BACKEND
        // --------------------------------------------------------
        stage('Build Backend') {
            steps {
                script {
                    echo '📦 Construction de l\'image Docker Server...'
                    sh "docker build -t ${SERVER_IMAGE} ./server"
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                script {
                    echo '🚀 Déploiement du Server...'
                    sh "docker stop ${SERVER_IMAGE} || true"
                    sh "docker rm ${SERVER_IMAGE} || true"
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

        // --------------------------------------------------------
        // ANALYSE DU FRONTEND (CLIENT)
        // --------------------------------------------------------
        stage('SonarQube Analysis - Client') {
            steps {
                script {
                    // On récupère à nouveau l'outil pour cette étape
                    def scannerHome = tool 'sonar-scanner'
                    
                    withSonarQubeEnv('SonarCloud') {
                        sh """
                            "${scannerHome}/bin/sonar-scanner" \
                            -Dsonar.organization=${SONAR_ORG} \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY_CLIENT} \
                            -Dsonar.sources=client \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/*.spec.ts,**/environment*.ts \
                            -Dsonar.tests=client \
                            -Dsonar.test.inclusions=**/*.spec.ts
                        """
                    }
                }
            }
        }

        stage('Quality Gate - Client') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // --------------------------------------------------------
        // BUILD & DEPLOY FRONTEND
        // --------------------------------------------------------
        stage('Build Frontend') {
            steps {
                script {
                    echo '📦 Construction de l\'image Docker Client...'
                    sh "docker build -t ${CLIENT_IMAGE} ./client"
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                script {
                    echo '🚀 Déploiement du Client HTTPS...'
                    sh "docker stop ${CLIENT_IMAGE} || true"
                    sh "docker rm ${CLIENT_IMAGE} || true"
                    
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

    post {
        always {
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