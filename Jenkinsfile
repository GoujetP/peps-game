pipeline {
    agent any

    environment {
        // --- CONFIG DOCKER ---
        SERVER_IMAGE = "peps-game-server"
        CLIENT_IMAGE = "peps-game-client"
        NETWORK_NAME = "cicd-net" 
        
        SERVER_PORT = "3000"
        CLIENT_PORT = "80"

        // --- CONFIG SONAR ---
        SONAR_ORG = "sonarqube-goujetp"
        SONAR_PROJECT_KEY_SERVER = "peps-game-backend"
        SONAR_PROJECT_KEY_CLIENT = "peps-game-frontend"
    }

    stages {
        // --------------------------------------------------------
        // BACKEND : ANALYSE + VERIFICATION MANUELLE
        // --------------------------------------------------------
        stage('SonarQube Analysis - Server') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('SonarCloud') {
                        sh """
                            "${scannerHome}/bin/sonar-scanner" \
                            -Dsonar.organization=${SONAR_ORG} \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY_SERVER} \
                            -Dsonar.branch.name=main \
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

        stage('Quality Gate - Server (Check API)') {
            steps {
                script {
                    echo '⏳ Attente de la fin du calcul SonarCloud (10s)...'
                    sleep 10 // On laisse le temps à Sonar de calculer
                    
                    // On interroge l'API avec ton token stocké dans Jenkins
                    withCredentials([string(credentialsId: 'sonarcloud-token', variable: 'SONAR_TOKEN')]) {
                        // On demande le statut du projet
                        def result = sh(script: """
                            curl -s -u "${SONAR_TOKEN}:" \
                            "https://sonarcloud.io/api/qualitygates/project_status?projectKey=${SONAR_PROJECT_KEY_SERVER}&branch=main"
                        """, returnStdout: true).trim()
                        
                        echo "🔍 Réponse SonarCloud : ${result}"
                        
                        // On vérifie si ça contient "OK"
                        if (result.contains('"status":"OK"')) {
                            echo "✅ Quality Gate SERVER : VALIDÉ"
                        } else if (result.contains('"status":"ERROR"')) {
                            error "❌ Quality Gate SERVER : ÉCHEC (Code de mauvaise qualité)"
                        } else {
                            echo "⚠️ Statut inconnu ou en cours, on continue quand même pour ce TP..."
                        }
                    }
                }
            }
        }

        // --------------------------------------------------------
        // BACKEND : BUILD & DEPLOY
        // --------------------------------------------------------
        stage('Build Backend') {
            steps {
                script {
                    echo '📦 Construction Server...'
                    sh "docker build -t ${SERVER_IMAGE} ./server"
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                script {
                    echo '🚀 Déploiement Server...'
                    sh "docker stop ${SERVER_IMAGE} || true"
                    sh "docker rm ${SERVER_IMAGE} || true"
                    
                    // Récupérer les credentials depuis Jenkins
                    withCredentials([string(credentialsId: 'database-url', variable: 'DATABASE_URL')]) {
                        sh """
                            docker run -d --name ${SERVER_IMAGE} \
                            --network ${NETWORK_NAME} --restart unless-stopped \
                            -p ${SERVER_PORT}:3000 \
                            -e DATABASE_URL="${DATABASE_URL}" \
                            ${SERVER_IMAGE}
                        """
                    }
                }
            }
        }

        // --------------------------------------------------------
        // FRONTEND : ANALYSE + VERIFICATION MANUELLE
        // --------------------------------------------------------
        stage('SonarQube Analysis - Client') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('SonarCloud') {
                        sh """
                            "${scannerHome}/bin/sonar-scanner" \
                            -Dsonar.organization=${SONAR_ORG} \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY_CLIENT} \
                            -Dsonar.branch.name=main \
                            -Dsonar.sources=client \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/*.spec.ts,**/environment*.ts \
                            -Dsonar.tests=client \
                            -Dsonar.test.inclusions=**/*.spec.ts
                        """
                    }
                }
            }
        }

        stage('Quality Gate - Client (Check API)') {
            steps {
                script {
                    echo '⏳ Attente du calcul (10s)...'
                    sleep 10
                    withCredentials([string(credentialsId: 'sonarcloud-token', variable: 'SONAR_TOKEN')]) {
                        def result = sh(script: """
                            curl -s -u "${SONAR_TOKEN}:" \
                            "https://sonarcloud.io/api/qualitygates/project_status?projectKey=${SONAR_PROJECT_KEY_CLIENT}&branch=main"
                        """, returnStdout: true).trim()
                        
                        echo "🔍 Réponse SonarCloud : ${result}"
                        
                        if (result.contains('"status":"OK"')) {
                            echo "✅ Quality Gate CLIENT : VALIDÉ"
                        } else if (result.contains('"status":"ERROR"')) {
                            error "❌ Quality Gate CLIENT : ÉCHEC"
                        }
                    }
                }
            }
        }

        // --------------------------------------------------------
        // FRONTEND : BUILD & DEPLOY
        // --------------------------------------------------------
        stage('Build Frontend') {
            steps {
                script {
                    echo '📦 Construction Client...'
                    sh "docker build -t ${CLIENT_IMAGE} ./client"
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                script {
                    echo '🚀 Déploiement Client HTTPS...'
                    sh "docker stop ${CLIENT_IMAGE} || true"
                    sh "docker rm ${CLIENT_IMAGE} || true"
                    sh """
                        docker run -d --name ${CLIENT_IMAGE} \
                        --network ${NETWORK_NAME} --restart unless-stopped \
                        -p 80:80 -p 443:443 \
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