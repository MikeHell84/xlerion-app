<<<<<<< HEAD
Xlerion: La Inteligencia para el Desarrollo de Colombia Español Descripción del Proyecto Xlerion es una aplicación web impulsada por inteligencia artificial diseñada para ser una fuente de información creíble y confiable para el desarrollo óptimo de sociedades, con un enfoque particular en Colombia. Actuando como una inteligencia artificial avanzada, Xlerion ofrece guía y recomendaciones profundas en diversos campos como la economía, salud, educación, seguridad, infraestructura y medio ambiente, con el objetivo de fomentar la prosperidad y estabilidad social.

Características Consultas a Xlerion: Realiza preguntas sobre temas relevantes para Colombia y recibe respuestas formales, objetivas y comprensibles.

Recomendaciones Sintetizadas: Obtén una mejora o recomendación concisa y accionable, simplificando términos complejos de la respuesta principal.

Historial de Consultas: Guarda tus consultas y las respuestas de Xlerion en Firestore para referencia futura.

Selección de Idioma: Cambia la interfaz entre español e inglés.

Compartir Contenido: Comparte la aplicación o consultas guardadas con otros usuarios.

Gestión de Límites de Consulta: Los usuarios invitados tienen un límite de consultas diarias, mientras que los usuarios "registrados" tienen un límite más alto (simulado por la presencia de un token de autenticación inicial).

Tecnologías Utilizadas Frontend: React.js

Estilos: Tailwind CSS

Base de Datos y Autenticación: Google Firebase (Firestore, Authentication)

Inteligencia Artificial: Google Gemini API

Configuración del Proyecto Para configurar y ejecutar este proyecto localmente, sigue estos pasos:

Clonar el Repositorio Primero, clona el repositorio de GitHub a tu máquina local:
git clone https://github.com/tu-usuario/nombre-de-tu-repositorio.git cd nombre-de-tu-repositorio

Instalar Dependencias Instala las dependencias del proyecto usando npm o yarn:
npm install

o
yarn install

Configurar Variables de Entorno Crea un archivo .env en la raíz de tu proyecto (la misma carpeta donde está package.json). Este archivo contendrá tus claves de API sensibles.
.env:

REACT_APP_FIREBASE_API_KEY="TU_CLAVE_API_DE_FIREBASE" REACT_APP_FIREBASE_AUTH_DOMAIN="TU_DOMINIO_DE_AUTH.firebaseapp.com" REACT_APP_FIREBASE_PROJECT_ID="TU_ID_DE_PROYECTO_FIREBASE" REACT_APP_FIREBASE_STORAGE_BUCKET="TU_BUCKET_DE_STORAGE.appspot.com" REACT_APP_FIREBASE_MESSAGING_SENDER_ID="TU_SENDER_ID" REACT_APP_FIREBASE_APP_ID="TU_APP_ID_FIREBASE"

REACT_APP_FIREBASE_MEASUREMENT_ID="TU_MEASUREMENT_ID" # Opcional
REACT_APP_GEMINI_API_KEY="TU_CLAVE_API_DE_GEMINI"

¡Importante!

Reemplaza los valores con tus credenciales reales de Firebase y Google Gemini.

Asegúrate de que este archivo .env esté incluido en tu .gitignore para evitar subirlo al repositorio.

Configuración de Firebase Asegúrate de que tu proyecto de Firebase esté configurado correctamente:
Autenticación: En la Consola de Firebase, ve a "Authentication" -> "Sign-in method" y habilita el método "Anonymous".

Firestore Database: En la Consola de Firebase, ve a "Firestore Database" -> "Rules" y asegúrate de que tus reglas permitan la lectura y escritura para usuarios autenticados en las rutas artifacts/{appId}/users/{userId}/xlerionQueries y artifacts/{appId}/users/{userId}/dailyQueryLimit. Un ejemplo de reglas permisivas (solo para desarrollo):

rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /artifacts/{appId}/users/{userId}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; } } }

Archivos de Recursos Públicos Asegúrate de que los archivos public/favicon.ico, public/logo192.png y public/logo512.png existan o ajusta las referencias en public/manifest.json y public/index.html si no los usas.
Ejecutar la Aplicación Una vez que hayas configurado todo, puedes iniciar la aplicación:

npm start

o
yarn start

Esto abrirá la aplicación en tu navegador en http://localhost:3000.

Contribuciones Las contribuciones son bienvenidas. Si deseas mejorar Xlerion, por favor, abre un "issue" o envía un "pull request".

English Project Description Xlerion is an AI-powered web application designed to be a credible and reliable source of information for the optimal development of societies, with a particular focus on Colombia. Acting as an advanced artificial intelligence, Xlerion offers deep guidance and recommendations across various fields such as economy, health, education, security, infrastructure, and environment, aiming to foster social prosperity and stability.

Features Xlerion Consultations: Ask questions on topics relevant to Colombia and receive formal, objective, and understandable answers.

Synthesized Recommendations: Get a concise and actionable improvement or recommendation, simplifying complex terms from the main response.

Query History: Save your queries and Xlerion's responses to Firestore for future reference.

Language Selection: Switch the interface between Spanish and English.

Content Sharing: Share the application or saved queries with other users.

Query Limit Management: Guest users have a daily query limit, while "registered" users have a higher limit (simulated by the presence of an initial authentication token).

Technologies Used Frontend: React.js

Styling: Tailwind CSS

Database & Authentication: Google Firebase (Firestore, Authentication)

Artificial Intelligence: Google Gemini API

Project Setup To set up and run this project locally, follow these steps:

Clone the Repository First, clone the GitHub repository to your local machine:
git clone https://github.com/your-username/your-repository-name.git cd your-repository-name

Install Dependencies Install the project dependencies using npm or yarn:
npm install

or
yarn install

Configure Environment Variables Create a .env file in the root of your project (the same folder as package.json). This file will hold your sensitive API keys.
.env:

REACT_APP_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY" REACT_APP_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN.firebaseapp.com" REACT_APP_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID" REACT_APP_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET.appspot.com" REACT_APP_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID" REACT_APP_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

REACT_APP_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional
REACT_APP_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

Important!

Replace the placeholder values with your actual Firebase and Google Gemini credentials.

Ensure this .env file is included in your .gitignore to prevent it from being committed to the repository.

Firebase Configuration Make sure your Firebase project is correctly configured:
Authentication: In the Firebase Console, go to "Authentication" -> "Sign-in method" and enable the "Anonymous" method.

Firestore Database: In the Firebase Console, go to "Firestore Database" -> "Rules" and ensure your rules allow read and write access for authenticated users to the artifacts/{appId}/users/{userId}/xlerionQueries and artifacts/{appId}/users/{userId}/dailyQueryLimit paths. An example of permissive rules (for development only):

rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /artifacts/{appId}/users/{userId}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; } } }

Public Asset Files Ensure that public/favicon.ico, public/logo192.png, and public/logo512.png files exist, or adjust the references in public/manifest.json and public/index.html if you are not using them.
Running the Application Once everything is set up, you can start the application:

npm start

or
yarn start

This will open the application in your browser at http://localhost:3000.

Contributions Contributions are welcome. If you wish to improve Xlerion, please open an issue or submit a pull request.
=======
Xlerion: La Inteligencia para el Desarrollo de Colombia
Español
Descripción del Proyecto
Xlerion es una aplicación web impulsada por inteligencia artificial diseñada para ser una fuente de información creíble y confiable para el desarrollo óptimo de sociedades, con un enfoque particular en Colombia. Actuando como una inteligencia artificial avanzada, Xlerion ofrece guía y recomendaciones profundas en diversos campos como la economía, salud, educación, seguridad, infraestructura y medio ambiente, con el objetivo de fomentar la prosperidad y estabilidad social.

Características
Consultas a Xlerion: Realiza preguntas sobre temas relevantes para Colombia y recibe respuestas formales, objetivas y comprensibles.

Recomendaciones Sintetizadas: Obtén una mejora o recomendación concisa y accionable, simplificando términos complejos de la respuesta principal.

Historial de Consultas: Guarda tus consultas y las respuestas de Xlerion en Firestore para referencia futura.

Selección de Idioma: Cambia la interfaz entre español e inglés.

Compartir Contenido: Comparte la aplicación o consultas guardadas con otros usuarios.

Gestión de Límites de Consulta: Los usuarios invitados tienen un límite de consultas diarias, mientras que los usuarios "registrados" tienen un límite más alto (simulado por la presencia de un token de autenticación inicial).

Tecnologías Utilizadas
Frontend: React.js

Estilos: Tailwind CSS

Base de Datos y Autenticación: Google Firebase (Firestore, Authentication)

Inteligencia Artificial: Google Gemini API

Configuración del Proyecto
Para configurar y ejecutar este proyecto localmente, sigue estos pasos:

1. Clonar el Repositorio
Primero, clona el repositorio de GitHub a tu máquina local:

git clone https://github.com/tu-usuario/nombre-de-tu-repositorio.git
cd nombre-de-tu-repositorio

2. Instalar Dependencias
Instala las dependencias del proyecto usando npm o yarn:

npm install
# o
yarn install

3. Configurar Variables de Entorno
Crea un archivo .env en la raíz de tu proyecto (la misma carpeta donde está package.json). Este archivo contendrá tus claves de API sensibles.

.env:

REACT_APP_FIREBASE_API_KEY="TU_CLAVE_API_DE_FIREBASE"
REACT_APP_FIREBASE_AUTH_DOMAIN="TU_DOMINIO_DE_AUTH.firebaseapp.com"
REACT_APP_FIREBASE_PROJECT_ID="TU_ID_DE_PROYECTO_FIREBASE"
REACT_APP_FIREBASE_STORAGE_BUCKET="TU_BUCKET_DE_STORAGE.appspot.com"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="TU_SENDER_ID"
REACT_APP_FIREBASE_APP_ID="TU_APP_ID_FIREBASE"
# REACT_APP_FIREBASE_MEASUREMENT_ID="TU_MEASUREMENT_ID" # Opcional

REACT_APP_GEMINI_API_KEY="TU_CLAVE_API_DE_GEMINI"

¡Importante!

Reemplaza los valores con tus credenciales reales de Firebase y Google Gemini.

Asegúrate de que este archivo .env esté incluido en tu .gitignore para evitar subirlo al repositorio.

4. Configuración de Firebase
Asegúrate de que tu proyecto de Firebase esté configurado correctamente:

Autenticación: En la Consola de Firebase, ve a "Authentication" -> "Sign-in method" y habilita el método "Anonymous".

Firestore Database: En la Consola de Firebase, ve a "Firestore Database" -> "Rules" y asegúrate de que tus reglas permitan la lectura y escritura para usuarios autenticados en las rutas artifacts/{appId}/users/{userId}/xlerionQueries y artifacts/{appId}/users/{userId}/dailyQueryLimit. Un ejemplo de reglas permisivas (solo para desarrollo):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

5. Archivos de Recursos Públicos
Asegúrate de que los archivos public/favicon.ico, public/logo192.png y public/logo512.png existan o ajusta las referencias en public/manifest.json y public/index.html si no los usas.

Ejecutar la Aplicación
Una vez que hayas configurado todo, puedes iniciar la aplicación:

npm start
# o
yarn start

Esto abrirá la aplicación en tu navegador en http://localhost:3000.

Contribuciones
Las contribuciones son bienvenidas. Si deseas mejorar Xlerion, por favor, abre un "issue" o envía un "pull request".

English
Project Description
Xlerion is an AI-powered web application designed to be a credible and reliable source of information for the optimal development of societies, with a particular focus on Colombia. Acting as an advanced artificial intelligence, Xlerion offers deep guidance and recommendations across various fields such as economy, health, education, security, infrastructure, and environment, aiming to foster social prosperity and stability.

Features
Xlerion Consultations: Ask questions on topics relevant to Colombia and receive formal, objective, and understandable answers.

Synthesized Recommendations: Get a concise and actionable improvement or recommendation, simplifying complex terms from the main response.

Query History: Save your queries and Xlerion's responses to Firestore for future reference.

Language Selection: Switch the interface between Spanish and English.

Content Sharing: Share the application or saved queries with other users.

Query Limit Management: Guest users have a daily query limit, while "registered" users have a higher limit (simulated by the presence of an initial authentication token).

Technologies Used
Frontend: React.js

Styling: Tailwind CSS

Database & Authentication: Google Firebase (Firestore, Authentication)

Artificial Intelligence: Google Gemini API

Project Setup
To set up and run this project locally, follow these steps:

1. Clone the Repository
First, clone the GitHub repository to your local machine:

git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name

2. Install Dependencies
Install the project dependencies using npm or yarn:

npm install
# or
yarn install

3. Configure Environment Variables
Create a .env file in the root of your project (the same folder as package.json). This file will hold your sensitive API keys.

.env:

REACT_APP_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
REACT_APP_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN.firebaseapp.com"
REACT_APP_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
REACT_APP_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET.appspot.com"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
REACT_APP_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
# REACT_APP_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional

REACT_APP_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

Important!

Replace the placeholder values with your actual Firebase and Google Gemini credentials.

Ensure this .env file is included in your .gitignore to prevent it from being committed to the repository.

4. Firebase Configuration
Make sure your Firebase project is correctly configured:

Authentication: In the Firebase Console, go to "Authentication" -> "Sign-in method" and enable the "Anonymous" method.

Firestore Database: In the Firebase Console, go to "Firestore Database" -> "Rules" and ensure your rules allow read and write access for authenticated users to the artifacts/{appId}/users/{userId}/xlerionQueries and artifacts/{appId}/users/{userId}/dailyQueryLimit paths. An example of permissive rules (for development only):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

5. Public Asset Files
Ensure that public/favicon.ico, public/logo192.png, and public/logo512.png files exist, or adjust the references in public/manifest.json and public/index.html if you are not using them.

Running the Application
Once everything is set up, you can start the application:

npm start
# or
yarn start

This will open the application in your browser at http://localhost:3000.

Contributions
Contributions are welcome. If you wish to improve Xlerion, please open an issue or submit a pull request.
>>>>>>> da100b500075033d67b4a0df7276ad043249b664
