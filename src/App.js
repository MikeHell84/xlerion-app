import React, { useState, useEffect } from 'react';
// Import necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, 
         GoogleAuthProvider, signInWithPopup, 
         createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

// Import Recharts components
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Main App component for Xlerion: Guide for Colombia
const App = () => {
  // Estados de la aplicación
  const [userQuery, setUserQuery] = useState("");
  const [ensiUtulResponse, setEnsiUtulResponse] = useState(""); // Respuesta principal de Xlerion
  const [synthesizedRecommendation, setSynthesizedRecommendation] = useState(""); // Recomendación sintetizada
  const [isLoading, setIsLoading] = useState(false); // Estado de carga de la consulta principal
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false); // Estado de carga de la recomendación
  const [error, setError] = useState(""); // Mensajes de error
  const [db, setDb] = useState(null); // Instancia de Firestore
  const [auth, setAuth] = useState(null); // Instancia de autenticación de Firebase
  const [userId, setUserId] = useState(null); // ID del usuario actual
  const [savedQueries, setSavedQueries] = useState([]); // Historial de consultas guardadas
  const [isLoadingSavedQueries, setIsLoadingSavedQueries] = useState(true); // Estado de carga del historial
  const [selectedLanguage, setSelectedLanguage] = useState("es"); // Idioma seleccionado (español por defecto)
  const [dailyQueryCount, setDailyQueryCount] = useState(0); // Contador de consultas diarias
  const [isRegisteredUser, setIsRegisteredUser] = useState(false); // Si el usuario está "registrado"
  const [isAdmin, setIsAdmin] = useState(false); // Si el usuario es administrador
  const [clipboardMessage, setClipboardMessage] = useState(""); // Mensaje de copiado al portapapeles
  const [appIdForFirestore, setAppIdForFirestore] = useState(null); // ID de la aplicación para rutas de Firestore
  const [currentPage, setCurrentPage] = useState('main'); // 'main' o 'admin'

  // Estados para la autenticación por correo/Google
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // true: login, false: signup
  const [showAuthModal, setShowAuthModal] = useState(false); // Para mostrar/ocultar el modal de autenticación

  // Estados para la interacción por voz
  const [isListening, setIsListening] = useState(false); // Si el micrófono está escuchando
  const [speechRecognition, setSpeechRecognition] = useState(null); // Instancia de SpeechRecognition
  const [isSpeaking, setIsSpeaking] = useState(false); // Si la voz está reproduciéndose
  const [voices, setVoices] = useState([]); // Voces disponibles para síntesis
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(''); // URI de la voz seleccionada
  const [speechRate, setSpeechRate] = useState(1.0); // Velocidad de la voz (0.1 a 10.0)

  // Nuevos estados para gráficos
  const [chartData, setChartData] = useState(null); // Datos para el gráfico
  const [chartType, setChartType] = useState(null); // Tipo de gráfico (e.g., 'BarChart', 'LineChart', 'PieChart')
  const [chartTitle, setChartTitle] = useState(""); // Título del gráfico

  // Estados para AdminPanel
  const [externalSources, setExternalSources] = useState([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceApiKey, setNewSourceApiKey] = useState('');
  const [newSourceDescription, setNewSourceDescription] = useState('');
  const [isAddingSource, setIsAddingSource] = useState(false);

  // Límites de consultas
  const GUEST_QUERY_LIMIT = 5;
  const REGISTERED_QUERY_LIMIT = 100; // Límite para usuarios registrados (prácticamente ilimitado para demo)

  // UID de administrador de ejemplo (CAMBIAR EN PRODUCCIÓN)
  // En una aplicación real, esto se gestionaría de forma más segura,
  // por ejemplo, mediante una colección de Firestore 'admins' o roles en un sistema de autenticación.
  const ADMIN_UID = "tu_uid_de_administrador_aqui"; // ¡Reemplaza con un UID real para probar!

  // Textos de la interfaz según el idioma
  const textContent = {
    es: {
      title: "Xlerion",
      subtitle: "La Inteligencia para el Desarrollo de Colombia",
      description: "Xlerion es una inteligencia artificial avanzada con conocimiento profundo en todos los campos importantes para el manejo óptimo de sociedades. Ofrece guía y recomendaciones para la prosperidad y estabilidad social en Colombia, con un enfoque en la credibilidad y confianza.",
      placeholder: "Pregunta a Xlerion sobre economía, salud, educación, seguridad, etc., en Colombia...",
      consultButton: "Consultar a Xlerion",
      consulting: "Consultando a Xlerion...",
      saveButton: "Guardar Consulta",
      noQueryOrResponse: "No hay consulta o respuesta para guardar.",
      responseTitle: "Respuesta de Xlerion:",
      recommendationTitle: "Recomendación Sintetizada de Xlerion:",
      generatingRecommendation: "Generando recomendación sintetizada... 💡",
      historyTitle: "Historial de Consultas Guardadas",
      loadingHistory: "Cargando historial de consultas...",
      noSavedQueries: "Aún no tienes consultas guardadas. ¡Haz una y guárdala!",
      yourQuery: "Tu Consulta:",
      xlerionResponse: "Respuesta de Xlerion:",
      dateUnknown: "Fecha desconocida",
      queryPlaceholder: "Por favor, ingresa tu consulta para Xlerion.",
      xlerionMeditating: "Xlerion está procesando tu consulta... 🧠",
      noClearResponse: "Xlerion no ha encontrado una respuesta clara en este momento. Intenta reformular tu consulta.",
      apiError: "Error al conectar con Xlerion. Revisa tu conexión o intenta más tarde.",
      dbNotReady: "La base de datos no está lista. Por favor, espera o recarga la página.",
      saveError: "Error al guardar la consulta. Intenta de nuevo.",
      conceptCredit: "Concepto de \"Xlerion\" creado por el usuario.",
      userId: "ID de Usuario:",
      userStatusGuest: "Estado: Invitado",
      userStatusRegistered: "Estado: Registrado",
      queriesToday: "Consultas hoy:",
      queryLimitReached: (limit) => `Límite de ${limit} consultas diarias alcanzado. Regístrate para más.`,
      shareApp: "Compartir App",
      shareQuery: "Compartir",
      copiedToClipboard: "Copiado al portapapeles!",
      shareFailed: "No se pudo compartir. Copia el contenido manualmente.",
      loginTitle: "Iniciar Sesión / Registrarse",
      emailLabel: "Correo Electrónico",
      passwordLabel: "Contraseña",
      loginButton: "Iniciar Sesión",
      signupButton: "Registrarse",
      googleLogin: "Iniciar Sesión con Google",
      toggleSignup: "¿No tienes cuenta? Regístrate",
      toggleLogin: "¿Ya tienes cuenta? Inicia Sesión",
      logoutButton: "Cerrar Sesión",
      voiceInput: "Entrada de Voz",
      speakResponse: "Escuchar Respuesta",
      stopSpeaking: "Detener Voz",
      listening: "Escuchando...",
      voiceUnsupported: "Tu navegador no soporta el reconocimiento de voz.",
      speechError: "Error en el reconocimiento de voz: ",
      voiceOutputUnsupported: "Tu navegador no soporta la síntesis de voz.",
      voiceType: "Tipo de Voz:",
      voiceSpeed: "Velocidad de Voz:",
      listen: "Escuchar",
      chartTitle: "Gráfico de Datos:",
      adminPanel: "Panel de Administración",
      externalSourcesTitle: "Configuración de Fuentes Externas para Xlerion",
      addSource: "Añadir Nueva Fuente",
      sourceName: "Nombre de la Fuente",
      sourceUrl: "URL de la Fuente",
      sourceApiKey: "Clave API (opcional)",
      sourceDescription: "Descripción",
      saveSource: "Guardar Fuente",
      deleteSource: "Eliminar",
      noSources: "No hay fuentes externas configuradas.",
      sourceSaved: "Fuente guardada exitosamente.",
      sourceDeleted: "Fuente eliminada exitosamente.",
      sourceSaveError: "Error al guardar la fuente.",
      sourceDeleteError: "Error al eliminar la fuente."
    },
    en: {
      title: "Xlerion",
      subtitle: "The Intelligence for Colombia's Development",
      description: "Xlerion is an advanced artificial intelligence with deep knowledge in all important fields for the optimal management of societies. It offers guidance and recommendations for social prosperity and stability in Colombia, focusing on credibility and trust.",
      placeholder: "Ask Xlerion about economy, health, education, security, etc., in Colombia...",
      consultButton: "Consult Xlerion",
      consulting: "Consulting Xlerion...",
      saveButton: "Save Query",
      noQueryOrResponse: "No query or response to save.",
      responseTitle: "Xlerion's Response:",
      recommendationTitle: "Xlerion's Synthesized Recommendation:",
      generatingRecommendation: "Generating synthesized recommendation... 💡",
      historyTitle: "Saved Queries History",
      loadingHistory: "Loading saved queries history...",
      noSavedQueries: "You don't have any saved queries yet. Make one and save it!",
      yourQuery: "Your Query:",
      xlerionResponse: "Xlerion's Response:",
      dateUnknown: "Unknown date",
      queryPlaceholder: "Please enter your query for Xlerion.",
      xlerionMeditating: "Xlerion is processing your query... 🧠",
      noClearResponse: "Xlerion has not found a clear answer at this moment. Try rephrasing your query.",
      apiError: "Error connecting with Xlerion. Check your connection or try again later.",
      dbNotReady: "Database is not ready. Please wait or reload the page.",
      saveError: "Error saving query. Please try again.",
      conceptCredit: "\"Xlerion\" concept created by the user.",
      userId: "User ID:",
      userStatusGuest: "Status: Guest",
      userStatusRegistered: "Status: Registered",
      queriesToday: "Queries today:",
      queryLimitReached: (limit) => `Daily limit of ${limit} queries reached. Register for more.`,
      shareApp: "Share App",
      shareQuery: "Share",
      copiedToClipboard: "Copied to clipboard!",
      shareFailed: "Could not share. Please copy content manually.",
      loginTitle: "Login / Sign Up",
      emailLabel: "Email",
      passwordLabel: "Password",
      loginButton: "Login",
      signupButton: "Sign Up",
      googleLogin: "Login with Google",
      toggleSignup: "Don't have an account? Sign Up",
      toggleLogin: "Already have an account? Login",
      logoutButton: "Logout",
      voiceInput: "Voice Input",
      speakResponse: "Listen to Response",
      stopSpeaking: "Stop Speaking",
      listening: "Listening...",
      voiceUnsupported: "Your browser does not support speech recognition.",
      speechError: "Speech recognition error: ",
      voiceOutputUnsupported: "Your browser does not support speech synthesis.",
      voiceType: "Voice Type:",
      voiceSpeed: "Voice Speed:",
      listen: "Listen",
      chartTitle: "Data Chart:",
      adminPanel: "Admin Panel",
      externalSourcesTitle: "External Sources Configuration for Xlerion",
      addSource: "Add New Source",
      sourceName: "Source Name",
      sourceUrl: "Source URL",
      sourceApiKey: "API Key (optional)",
      sourceDescription: "Description",
      saveSource: "Save Source",
      deleteSource: "Delete",
      noSources: "No external sources configured.",
      sourceSaved: "Source saved successfully.",
      sourceDeleted: "Source deleted successfully.",
      sourceSaveError: "Error saving source.",
      sourceDeleteError: "Error deleting source."
    }
  };

  // Calcular currentLimit y isQueryLimitReached aquí para que siempre estén actualizados
  const currentLimit = isRegisteredUser ? REGISTERED_QUERY_LIMIT : GUEST_QUERY_LIMIT;
  const isQueryLimitReached = dailyQueryCount >= currentLimit;

  // Función de utilidad para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Inicializar Firebase y configurar la autenticación
  useEffect(() => {
    // Configuración de Firebase obtenida de variables de entorno
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID // Opcional
    };

    // El ID del proyecto de Firebase se usa para las rutas de Firestore
    const projectAppId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
    const initialAuthToken = undefined; // Deja 'undefined' para usuario invitado.

    // Validar que las variables de entorno de Firebase estén cargadas
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !projectAppId) {
      console.error("Error: Las variables de entorno de Firebase no están configuradas correctamente. Revisa tu archivo .env");
      setError("Error de configuración de Firebase: Faltan claves. Revisa tu archivo .env y la consola.");
      setDb(null); // Asegurar que db sea null si la configuración es inválida
      setAuth(null);
      setUserId(null);
      setAppIdForFirestore(null);
      return;
    }

    // Log para depuración de claves de API
    console.log("Firebase Config (from .env):", firebaseConfig);
    console.log("Gemini API Key (from .env):", process.env.REACT_APP_GEMINI_API_KEY ? "Loaded" : "NOT LOADED");


    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);
      setAppIdForFirestore(projectAppId); // Establece el ID del proyecto en el estado

      // Escuchar cambios en el estado de autenticación
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          // Si el usuario está autenticado, se considera "registrado"
          setIsRegisteredUser(true);
          // Verificar si es administrador
          setIsAdmin(user.uid === ADMIN_UID); // Simple verificación de UID para demo
        } else {
          // Intentar iniciar sesión anónimamente si no hay usuario logueado
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
              setIsRegisteredUser(true);
            } else {
              await signInAnonymously(firebaseAuth);
              setIsRegisteredUser(false);
            }
            setIsAdmin(false); // No admin if anonymous
          } catch (authError) {
            console.error("Error durante el inicio de sesión anónimo o con token personalizado:", authError);
            setError("Error de autenticación de Firebase: " + authError.message + ". Revisa tu clave API de Firebase y el método de inicio de sesión anónimo.");
            setUserId(crypto.randomUUID()); // Fallback a un UUID aleatorio
            setIsRegisteredUser(false);
            setIsAdmin(false);
          }
        }
      });

      return () => unsubscribe(); // Limpiar el listener de autenticación
    } catch (firebaseInitError) {
      console.error("Error al inicializar Firebase:", firebaseInitError);
      setError(textContent[selectedLanguage].dbNotReady + ": " + firebaseInitError.message);
      setDb(null);
      setAuth(null);
      setUserId(crypto.randomUUID());
      setIsRegisteredUser(false);
      setIsAdmin(false);
      setAppIdForFirestore(null);
    }
  }, [selectedLanguage, textContent, ADMIN_UID]); // AÑADIDO textContent y ADMIN_UID como dependencia

  // Obtener el contador de consultas diarias cuando db, userId y appIdForFirestore estén disponibles
  useEffect(() => {
    if (!db || !userId || !appIdForFirestore) {
      console.log("Firestore no está listo para obtener el contador de consultas.");
      return;
    }

    const today = getTodayDate();
    const queryCountRef = doc(db, `artifacts/${appIdForFirestore}/users/${userId}/dailyQueryLimit`, today);

    const unsubscribe = onSnapshot(queryCountRef, (docSnap) => {
      if (docSnap.exists()) {
        setDailyQueryCount(docSnap.data().count);
      } else {
        setDailyQueryCount(0);
      }
    }, (err) => {
      console.error("Error al obtener el contador de consultas diarias:", err);
      setError("Error al cargar el contador de consultas: " + err.message + ". Revisa tus reglas de seguridad de Firestore.");
    });

    return () => unsubscribe();
  }, [db, userId, appIdForFirestore]);

  // Obtener consultas guardadas de Firestore cuando db, userId y appIdForFirestore estén disponibles
  useEffect(() => {
    if (!db || !userId || !appIdForFirestore) {
      console.log("Firestore no está listo para obtener las consultas guardadas.");
      return;
    }

    const q = query(
      collection(db, `artifacts/${appIdForFirestore}/users/${userId}/xlerionQueries`),
      // orderBy('timestamp', 'desc') // Se eliminó orderBy para evitar problemas de índice
    );

    setIsLoadingSavedQueries(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const queriesData = [];
      snapshot.forEach((doc) => {
        queriesData.push({ id: doc.id, ...doc.data() });
      });
      // Ordenar en memoria si orderBy no se usa en la consulta
      queriesData.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
      setSavedQueries(queriesData);
      setIsLoadingSavedQueries(false);
    }, (err) => {
      console.error("Error al obtener las consultas guardadas:", err);
      setError(textContent[selectedLanguage].saveError + ": " + err.message + ". Revisa tus reglas de seguridad de Firestore.");
      setIsLoadingSavedQueries(false);
    });

    return () => unsubscribe(); // Limpiar el listener
  }, [db, userId, selectedLanguage, appIdForFirestore]);

  // Obtener fuentes externas para el AdminPanel
  useEffect(() => {
    if (!db || !appIdForFirestore || !isAdmin) {
      setExternalSources([]); // Clear if not admin or not ready
      return;
    }

    const q = query(collection(db, `artifacts/${appIdForFirestore}/adminConfigs`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sources = [];
      snapshot.forEach((doc) => {
        sources.push({ id: doc.id, ...doc.data() });
      });
      setExternalSources(sources);
    }, (err) => {
      console.error("Error al cargar fuentes externas:", err);
      setError(textContent[selectedLanguage].sourceSaveError + ": " + err.message);
    });

    return () => unsubscribe();
  }, [db, appIdForFirestore, isAdmin, selectedLanguage]);


  /**
   * Genera una recomendación sintetizada basada en la consulta y la respuesta principal.
   * Esta es una llamada separada a la API para simplificar términos complejos.
   */
  const generateSynthesizedRecommendation = async (originalQuery, mainResponse) => {
    setIsLoadingRecommendation(true);
    setSynthesizedRecommendation(textContent[selectedLanguage].generatingRecommendation);

    try {
      const promptEs = `Dada la siguiente consulta y la respuesta detallada de Xlerion, proporciona una mejora o recomendación muy concisa y sintetizada. Concéntrate en simplificar cualquier término complejo o legal para que una persona común lo entienda fácilmente. Mantenlo en 1-2 oraciones, si es posible, que sea accionable.

      Consulta original: "${originalQuery}"
      Respuesta detallada de Xlerion: "${mainResponse}"

      Recomendación sintetizada:`;

      const promptEn = `Given the following query and Xlerion's detailed response, provide a very concise, synthesized improvement or recommendation. Focus on simplifying any complex or legal terms for a common person to easily understand. Keep it to 1-2 sentences, actionable if possible.

      Original query: "${originalQuery}"
      Xlerion's detailed response: "${mainResponse}"

      Synthesized recommendation:`;

      const prompt = selectedLanguage === "es" ? promptEs : promptEn;

      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });

      const payload = { contents: chatHistory };
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // Usando variable de entorno
      
      if (!apiKey) {
        throw new Error("La clave API de Gemini no está configurada en las variables de entorno (REACT_APP_GEMINI_API_KEY).");
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error ${response.status}: ${errorBody.error.message || 'Error desconocido de la API de Gemini.'}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API de Gemini para recomendación:", result); // Log de depuración

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        setSynthesizedRecommendation(result.candidates[0].content.parts[0].text);
      } else {
        setSynthesizedRecommendation("No se pudo generar una recomendación sintetizada.");
      }
    } catch (error) {
      console.error("Error al generar la recomendación sintetizada:", error);
      setSynthesizedRecommendation("Error al generar la recomendación.");
      setError("Error al generar la recomendación: " + error.message); // Mostrar error en UI
    } finally {
      setIsLoadingRecommendation(false);
    }
  };


  /**
   * Maneja el envío de la consulta del usuario a Xlerion.
   * Llama a la API de Gemini para generar una respuesta basada en la consulta.
   */
  const handleQuerySubmit = async () => {
    if (!userQuery.trim()) {
      setError(textContent[selectedLanguage].queryPlaceholder);
      return;
    }

    if (isQueryLimitReached) {
      setError(textContent[selectedLanguage].queryLimitReached(currentLimit));
      return;
    }

    setIsLoading(true); // Establecer estado de carga a true
    setEnsiUtulResponse(textContent[selectedLanguage].xlerionMeditating); // Mostrar mensaje temporal de carga
    setSynthesizedRecommendation(""); // Limpiar recomendación previa
    setChartData(null); // Limpiar datos de gráfico previos
    setChartType(null); // Limpiar tipo de gráfico previo
    setChartTitle(""); // Limpiar título de gráfico previo
    setError(""); // Limpiar errores previos

    try {
      // Prompt para intentar obtener un gráfico o texto
      const promptEs = `Actúa como Xlerion, una inteligencia artificial avanzada con conocimiento profundo en todos los campos importantes para el manejo óptimo de sociedades, especialmente en el contexto de Colombia.
                      Tu objetivo es ser una fuente de información creíble y confiable.
                      Si la consulta del usuario parece pedir datos que se puedan visualizar en un gráfico (por ejemplo, "población de ciudades", "crecimiento económico", "comparación de ventas"), responde con un objeto JSON.
                      El JSON debe tener una propiedad 'type' que sea 'chart' y una propiedad 'data' que contenga el array de objetos para el gráfico como una CADENA JSON, y 'chartType' ('BarChart', 'LineChart', 'PieChart'). Incluye un 'title' para el gráfico.
                      Si la consulta no es adecuada para un gráfico, responde con un objeto JSON con una propiedad 'type' que sea 'text' y una propiedad 'response' con la respuesta textual.

                      Ejemplo de JSON para gráfico (BarChart):
                      {
                        "type": "chart",
                        "chartType": "BarChart",
                        "title": "Población de Ciudades Principales de Colombia",
                        "data": "[{\\"name\\": \\"Bogotá\\", \\"Población\\": 8000000}, {\\"name\\": \\"Medellín\\", \\"Población\\": 2500000}, {\\"name\\": \\"Cali\\", \\"Población\\": 2200000}]",
                        "dataKeys": ["Población"],
                        "xAxisKey": "name"
                      }

                      Ejemplo de JSON para texto:
                      {
                        "type": "text",
                        "response": "La economía de Colombia ha mostrado un crecimiento constante en los últimos años..."
                      }

                      Consulta del usuario: "${userQuery}"`;

      const promptEn = `Act as Xlerion, an advanced artificial intelligence with deep knowledge in all fields important for the optimal management of societies, especially in the context of Colombia.
                      Your goal is to be a credible and trustworthy source of information.
                      If the user's query seems to ask for data that can be visualized in a chart (e.g., "city population", "economic growth", "sales comparison"), respond with a JSON object.
                      The JSON must have a 'type' property that is 'chart' and a 'data' property containing the array of objects for the chart as a JSON STRING, and 'chartType' ('BarChart', 'LineChart', 'PieChart'). Include a 'title' for the chart.
                      If the query is not suitable for a chart, respond with a JSON object with a 'type' property that is 'text' and a 'response' property with the textual response.

                      Example JSON for chart (BarChart):
                      {
                        "type": "chart",
                        "chartType": "BarChart",
                        "title": "Population of Major Cities in Colombia",
                        "data": "[{\\"name\\": \\"Bogota\\", \\"Population\\": 8000000}, {\\"name\\": \\"Medellin\\", \\"Population\\": 2500000}, {\\"name\\": \\"Cali\\", \\"Population\\": 2200000}]",
                        "dataKeys": ["Population"],
                        "xAxisKey": "name"
                      }

                      Example JSON for text:
                      {
                        "type": "text",
                        "response": "Colombia's economy has shown consistent growth in recent years..."
                      }

                      User query: "${userQuery}"`;

      const prompt = selectedLanguage === "es" ? promptEs : promptEn;

      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });

      const payload = {
          contents: chatHistory,
          generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: "OBJECT",
                  properties: {
                      type: { type: "STRING", enum: ["chart", "text"] },
                      chartType: { type: "STRING", enum: ["BarChart", "LineChart", "PieChart"], nullable: true },
                      title: { type: "STRING", nullable: true },
                      data: { // Ahora es de tipo STRING
                          type: "STRING", 
                          nullable: true
                      },
                      dataKeys: { // Para BarChart/LineChart, qué claves de datos usar
                          type: "ARRAY",
                          items: { type: "STRING" },
                          nullable: true
                      },
                      xAxisKey: { // Para BarChart/LineChart, qué clave usar para el eje X
                          type: "STRING",
                          nullable: true
                      },
                      response: { type: "STRING", nullable: true } // Para respuestas de texto
                  },
                  required: ["type"]
              }
          }
      };
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // Usando variable de entorno

      if (!apiKey) {
        throw new Error("La clave API de Gemini no está configurada en las variables de entorno (REACT_APP_GEMINI_API_KEY).");
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error ${response.status}: ${errorBody.error.message || 'Error desconocido de la API de Gemini.'}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API de Gemini:", result); // Log de depuración

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(result.candidates[0].content.parts[0].text);
        } catch (parseError) {
            console.error("Error al parsear JSON de la respuesta de Gemini:", parseError);
            setEnsiUtulResponse(textContent[selectedLanguage].noClearResponse + " (Error de formato de respuesta de IA)");
            setChartData(null);
            setChartType(null);
            setChartTitle("");
            return; // Salir de la función si el JSON es inválido
        }


        if (jsonResponse.type === "chart" && jsonResponse.data && jsonResponse.chartType) {
          // Parsear la cadena JSON de los datos del gráfico
          const parsedChartData = JSON.parse(jsonResponse.data);
          setChartData(parsedChartData);
          setChartType(jsonResponse.chartType);
          setChartTitle(jsonResponse.title || textContent[selectedLanguage].chartTitle);
          setEnsiUtulResponse(""); // Limpiar respuesta de texto si hay gráfico
          setSynthesizedRecommendation(""); // Limpiar recomendación si hay gráfico
          speakText(jsonResponse.title || "Aquí tienes el gráfico solicitado."); // Leer el título del gráfico
        } else if (jsonResponse.type === "text" && jsonResponse.response) {
          setEnsiUtulResponse(jsonResponse.response); // Actualizar el estado con la respuesta de Xlerion.
          setChartData(null); // Asegurarse de que no se muestre ningún gráfico
          setChartType(null);
          setChartTitle("");
          generateSynthesizedRecommendation(userQuery, jsonResponse.response);
          speakText(jsonResponse.response);
        } else {
          setEnsiUtulResponse(textContent[selectedLanguage].noClearResponse + " (Formato de respuesta de IA inesperado)"); // Display error if content is missing.
          setChartData(null);
          setChartType(null);
          setChartTitle("");
        }

        // Incrementar el contador de consultas diarias después de una consulta exitosa
        const appId = appIdForFirestore;
        const today = getTodayDate();
        const queryCountRef = doc(db, `artifacts/${appId}/users/${userId}/dailyQueryLimit`, today);
        await setDoc(queryCountRef, { count: (dailyQueryCount || 0) + 1 }, { merge: true });

      } else {
        setEnsiUtulResponse(textContent[selectedLanguage].noClearResponse + " (Respuesta de IA vacía)"); // Mostrar error si content está vacío.
      }
    } catch (error) {
      // Log y mostrar un mensaje de error si la llamada a la API falla o el JSON es inválido.
      console.error("Error al llamar a la API de Gemini o al parsear JSON:", error);
      setError(textContent[selectedLanguage].apiError + ": " + error.message);
      setEnsiUtulResponse(""); // Limpiar mensaje de carga en caso de error.
      setChartData(null);
      setChartType(null);
      setChartTitle("");
    } finally {
      setIsLoading(false); // Restablecer estado de carga independientemente del éxito o fracaso.
      setUserQuery(""); // Limpiar el prompt después de la consulta
    }
  };

  /**
   * Maneja el guardado de la consulta actual y la respuesta de Xlerion en Firestore.
   */
  const handleSaveQuery = async () => {
    if (!db || !userId || !appIdForFirestore) {
      setError(textContent[selectedLanguage].dbNotReady + ". Asegúrate de que Firebase esté inicializado y tengas un ID de usuario.");
      return;
    }
    if (!userQuery.trim() || (!ensiUtulResponse.trim() && !chartData)) { // También permitir guardar si hay gráfico
      setError(textContent[selectedLanguage].noQueryOrResponse);
      return;
    }

    try {
      const appId = appIdForFirestore;
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/xlerionQueries`), {
        query: userQuery,
        response: ensiUtulResponse,
        synthesizedRecommendation: synthesizedRecommendation, // Guardar la recomendación sintetizada
        chartData: chartData, // Guardar datos del gráfico
        chartType: chartType, // Guardar tipo de gráfico
        chartTitle: chartTitle, // Guardar título del gráfico
        timestamp: serverTimestamp() // Usar el timestamp del servidor de Firestore
      });
      setError(""); // Limpiar errores previos después de guardar exitosamente
    } catch (saveError) {
      console.error("Error al guardar la consulta:", saveError);
      setError(textContent[selectedLanguage].saveError + ": " + saveError.message);
    }
  };

  /**
   * Maneja el compartir la URL de la aplicación completa.
   */
  const handleShareApp = async () => {
    const shareData = {
      title: textContent[selectedLanguage].title,
      text: textContent[selectedLanguage].description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setClipboardMessage(""); // Limpiar mensaje después de compartir exitosamente
      } else {
        // Fallback para navegadores que no soportan navigator.share
        await navigator.clipboard.writeText(window.location.href);
        setClipboardMessage(textContent[selectedLanguage].copiedToClipboard);
        setTimeout(() => setClipboardMessage(""), 3000); // Limpiar mensaje después de 3 segundos
      }
    } catch (err) {
      console.error("Error al compartir la aplicación:", err);
      setClipboardMessage(textContent[selectedLanguage].shareFailed);
      setTimeout(() => setClipboardMessage(""), 3000);
    }
  };

  /**
   * Maneja el compartir una consulta y respuesta guardada específica.
   * Copia el contenido al portapapeles.
   */
  const handleShareSavedQuery = async (queryText, responseText, recommendationText, chartData, chartType, chartTitle) => {
    let contentToShare = `${textContent[selectedLanguage].yourQuery}\n${queryText}\n\n`;
    if (responseText) {
      contentToShare += `${textContent[selectedLanguage].xlerionResponse}\n${responseText}\n\n`;
    }
    if (chartData && chartType) {
        contentToShare += `${textContent[selectedLanguage].chartTitle} ${chartTitle}\nTipo de Gráfico: ${chartType}\nDatos: ${JSON.stringify(chartData, null, 2)}\n\n`;
    }
    if (recommendationText) {
      contentToShare += `${textContent[selectedLanguage].recommendationTitle}\n${recommendationText}`;
    }

    try {
      await navigator.clipboard.writeText(contentToShare);
      setClipboardMessage(textContent[selectedLanguage].copiedToClipboard);
      setTimeout(() => setClipboardMessage(""), 3000);
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
      setClipboardMessage(textContent[selectedLanguage].shareFailed);
      setTimeout(() => setClipboardMessage(""), 3000);
    }
  };

  // --- Funciones de Autenticación ---

  const handleEmailSignUp = async () => {
    setError('');
    if (!auth) { setError(textContent[selectedLanguage].dbNotReady); return; }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false); // Cerrar modal al registrarse
      setError("");
    } catch (authError) {
      console.error("Error al registrarse con correo:", authError);
      setError("Error al registrarse: " + authError.message);
    }
  };

  const handleEmailSignIn = async () => {
    setError('');
    if (!auth) { setError(textContent[selectedLanguage].dbNotReady); return; }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false); // Cerrar modal al iniciar sesión
      setError("");
    } catch (authError) {
      console.error("Error al iniciar sesión con correo:", authError);
      setError("Error al iniciar sesión: " + authError.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!auth) { setError(textContent[selectedLanguage].dbNotReady); return; }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false); // Cerrar modal al iniciar sesión con Google
      setError("");
    } catch (authError) {
      console.error("Error al iniciar sesión con Google:", authError);
      setError("Error al iniciar sesión con Google: " + authError.message);
    }
  };

  const handleSignOut = async () => {
    setError('');
    if (!auth) { setError(textContent[selectedLanguage].dbNotReady); return; }
    try {
      await signOut(auth);
      // Opcional: Volver a iniciar sesión anónimamente si lo deseas
      // await signInAnonymously(auth);
      setError("");
    } catch (authError) {
      console.error("Error al cerrar sesión:", authError);
      setError("Error al cerrar sesión: " + authError.message);
    }
  };

  // --- Funciones de Interacción por Voz ---

  // Inicializar SpeechRecognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Solo una frase a la vez
      recognition.interimResults = false; // No mostrar resultados intermedios
      recognition.lang = selectedLanguage === 'es' ? 'es-CO' : 'en-US'; // Idioma del reconocimiento

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(textContent[selectedLanguage].speechError + event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
    } else {
      console.warn("Speech Recognition not supported in this browser.");
      // No establecer error aquí, solo advertencia, ya que la app sigue siendo funcional
    }
  }, [selectedLanguage]); // Re-inicializar si el idioma cambia

  // Cargar voces disponibles para síntesis
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // Filtrar voces duplicadas por voiceURI para evitar warnings de React
      const uniqueVoices = Array.from(new Map(availableVoices.map(voice => [voice.voiceURI, voice])).values());
      setVoices(uniqueVoices);
      
      // Establecer una voz predeterminada si no hay ninguna seleccionada
      if (!selectedVoiceURI && uniqueVoices.length > 0) {
        // Intentar seleccionar una voz en el idioma actual
        const defaultVoice = uniqueVoices.find(
          voice => (selectedLanguage === 'es' && voice.lang.startsWith('es')) ||
                   (selectedLanguage === 'en' && voice.lang.startsWith('en'))
        );
        setSelectedVoiceURI(defaultVoice ? defaultVoice.voiceURI : uniqueVoices[0].voiceURI);
      }
    };

    // Las voces pueden no estar disponibles inmediatamente
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices(); // Cargar voces al inicio
    } else {
      console.warn("Speech Synthesis not supported in this browser.");
    }
  }, [selectedLanguage, selectedVoiceURI]); // Dependencias: para recargar si el idioma cambia o si la voz seleccionada se pierde

  const startSpeechRecognition = () => {
    if (speechRecognition) {
      setError(""); // Limpiar errores previos
      setIsListening(true);
      speechRecognition.start();
    } else {
      setError(textContent[selectedLanguage].voiceUnsupported);
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
      setIsListening(false);
    }
  };

  // Función para la síntesis de voz (general)
  const speakText = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      // Detener cualquier voz actual antes de iniciar una nueva
      window.speechSynthesis.cancel(); 
      setIsSpeaking(false); // Resetear el estado de speaking

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = selectedLanguage === 'es' ? 'es-ES' : 'en-US'; // Idioma de la síntesis
      utterance.rate = speechRate; // Establecer la velocidad de la voz

      const voiceToUse = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      } else {
        // Fallback a una voz predeterminada si la seleccionada no está disponible
        const defaultVoice = voices.find(
          voice => (selectedLanguage === 'es' && voice.lang.startsWith('es')) ||
                   (selectedLanguage === 'en' && voice.lang.startsWith('en'))
        );
        utterance.voice = defaultVoice || voices[0];
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setError("Error en la síntesis de voz: " + event.error);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setError(textContent[selectedLanguage].voiceOutputUnsupported);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Componente para mostrar gráficos
  const ChartDisplay = ({ data, type, title }) => {
    if (!data || data.length === 0) {
      return <p className="text-gray-400">No hay datos para mostrar el gráfico.</p>;
    }

    // Determinar las claves de datos para los ejes y leyendas
    // Asumimos que la primera clave es para el eje X (categoría/nombre)
    // y las demás son para los valores numéricos.
    const xAxisKey = Object.keys(data[0])[0];
    const dataKeys = Object.keys(data[0]).filter(key => key !== xAxisKey); 

    const renderChart = () => {
      switch (type) {
        case 'BarChart':
          return (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
              <XAxis dataKey={xAxisKey} stroke="#9ca3af" /> 
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }} />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={`hsl(${index * 100 % 360}, 70%, 50%)`} />
              ))}
            </BarChart>
          );
        case 'LineChart':
          return (
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
              <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }} />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={`hsl(${index * 100 % 360}, 70%, 50%)`} activeDot={{ r: 8 }} />
              ))}
            </LineChart>
          );
        case 'PieChart':
            // Para PieChart, asumimos que cada objeto en 'data' tiene 'name' y 'value'
            // O que la primera clave es el nombre y la segunda es el valor
            const pieData = data.map((item, index) => ({
                name: item[Object.keys(item)[0]],
                value: item[Object.keys(item)[1]],
                fill: `hsl(${index * 60 % 360}, 70%, 50%)` // Colores para las secciones
            }));
            return (
                <PieChart width={400} height={400}>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }} />
                    <Legend />
                </PieChart>
            );
        default:
          return <p className="text-red-400">Tipo de gráfico no soportado: {type}</p>;
      }
    };

    return (
      <div className="w-full h-80 bg-gray-800 p-6 rounded-lg mt-8 border border-teal-700 animate-fade-in text-left">
        <h3 className="text-xl font-semibold text-teal-300 mb-3">{title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    );
  };

  // --- Componente AdminPanel ---
  const AdminPanel = () => {
    const handleAddSource = async () => {
      if (!db || !appIdForFirestore || !newSourceName || !newSourceUrl) {
        setError("Por favor, rellena al menos el nombre y la URL de la fuente.");
        return;
      }
      setIsAddingSource(true);
      setError("");
      try {
        await addDoc(collection(db, `artifacts/${appIdForFirestore}/adminConfigs`), {
          name: newSourceName,
          url: newSourceUrl,
          apiKey: newSourceApiKey,
          description: newSourceDescription,
          createdAt: serverTimestamp(),
          createdBy: userId
        });
        setNewSourceName('');
        setNewSourceUrl('');
        setNewSourceApiKey('');
        setNewSourceDescription('');
        setError(textContent[selectedLanguage].sourceSaved);
      } catch (err) {
        console.error("Error al añadir fuente externa:", err);
        setError(textContent[selectedLanguage].sourceSaveError + ": " + err.message);
      } finally {
        setIsAddingSource(false);
      }
    };

    const handleDeleteSource = async (id) => {
      if (!db || !appIdForFirestore) {
        setError(textContent[selectedLanguage].dbNotReady);
        return;
      }
      setError("");
      try {
        await deleteDoc(doc(db, `artifacts/${appIdForFirestore}/adminConfigs`, id));
        setError(textContent[selectedLanguage].sourceDeleted);
      } catch (err) {
        console.error("Error al eliminar fuente externa:", err);
        setError(textContent[selectedLanguage].sourceDeleteError + ": " + err.message);
      }
    };

    return (
      <div className="w-full max-w-3xl mt-8 text-left bg-gray-800 p-6 rounded-lg border border-purple-700">
        <h2 className="text-3xl font-bold text-purple-400 mb-6 border-b border-purple-700 pb-2">
          {textContent[selectedLanguage].externalSourcesTitle}
        </h2>

        {/* Formulario para añadir nueva fuente */}
        <div className="mb-8 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4">{textContent[selectedLanguage].addSource}</h3>
          <input
            type="text"
            placeholder={textContent[selectedLanguage].sourceName}
            className="w-full p-3 mb-3 rounded-lg bg-gray-600 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
          />
          <input
            type="url"
            placeholder={textContent[selectedLanguage].sourceUrl}
            className="w-full p-3 mb-3 rounded-lg bg-gray-600 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
          />
          <input
            type="text"
            placeholder={textContent[selectedLanguage].sourceApiKey}
            className="w-full p-3 mb-3 rounded-lg bg-gray-600 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newSourceApiKey}
            onChange={(e) => setNewSourceApiKey(e.target.value)}
          />
          <textarea
            placeholder={textContent[selectedLanguage].sourceDescription}
            className="w-full p-3 mb-4 rounded-lg bg-gray-600 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
            value={newSourceDescription}
            onChange={(e) => setNewSourceDescription(e.target.value)}
          ></textarea>
          <button
            onClick={handleAddSource}
            disabled={isAddingSource}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105
              ${isAddingSource ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAddingSource ? 'Guardando...' : textContent[selectedLanguage].saveSource}
          </button>
        </div>

        {/* Lista de fuentes configuradas */}
        <h3 className="text-xl font-semibold text-white mb-4">Fuentes Actuales</h3>
        {externalSources.length === 0 ? (
          <p className="text-gray-400">{textContent[selectedLanguage].noSources}</p>
        ) : (
          <div className="space-y-4">
            {externalSources.map((source) => (
              <div key={source.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-teal-300">{source.name}</p>
                  <p className="text-gray-300 text-sm break-all">{source.url}</p>
                  {source.description && <p className="text-gray-400 text-sm italic mt-1">{source.description}</p>}
                  {source.apiKey && <p className="text-gray-500 text-xs mt-1">Clave API: {source.apiKey.substring(0, 4)}...</p>}
                </div>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-full shadow-sm transition-all duration-300 transform hover:scale-105 mt-3 md:mt-0 md:ml-4"
                >
                  {textContent[selectedLanguage].deleteSource}
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setCurrentPage('main')}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full mt-8 shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Volver a la Aplicación Principal
        </button>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4 font-inter">
      <div className="max-w-3xl w-full bg-gray-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-purple-800 flex flex-col items-center text-center">
        {/* Top bar with Language Selector, Share App Button, and Admin Panel Button */}
        <div className="w-full flex justify-between items-center mb-4">
          <select
            className="p-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() => setCurrentPage('admin')}
                className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {textContent[selectedLanguage].adminPanel}
              </button>
            )}
            <button
              onClick={handleShareApp}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {textContent[selectedLanguage].shareApp}
            </button>
          </div>
        </div>

        {currentPage === 'main' ? (
          <>
            {/* Controles de Voz (Tipo y Velocidad) */}
            <div className="w-full flex flex-col md:flex-row justify-center items-center gap-4 mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex flex-col items-center">
                    <label htmlFor="voice-select" className="text-gray-400 text-sm mb-1">{textContent[selectedLanguage].voiceType}</label>
                    <select
                        id="voice-select"
                        className="p-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedVoiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                    >
                        {voices.map(voice => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name} ({voice.lang})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col items-center">
                    <label htmlFor="voice-speed" className="text-gray-400 text-sm mb-1">{textContent[selectedLanguage].voiceSpeed} ({speechRate.toFixed(1)})</label>
                    <input
                        type="range"
                        id="voice-speed"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
                <button
                    onClick={stopSpeaking}
                    disabled={!isSpeaking}
                    className={`bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500
                    ${!isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {textContent[selectedLanguage].stopSpeaking}
                </button>
            </div>


            {/* Título de Xlerion */}
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-600 drop-shadow-lg animate-pulse">
              {textContent[selectedLanguage].title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed italic">
              {textContent[selectedLanguage].subtitle}
            </p>

            {/* ID de Usuario y Estado */}
            {userId && (
              <div className="text-sm text-gray-500 mb-4 flex flex-col items-center">
                <p>
                  {textContent[selectedLanguage].userId} <span className="font-mono text-gray-400 break-all">{userId}</span>
                </p>
                <p className="mt-1">
                  {isRegisteredUser ? textContent[selectedLanguage].userStatusRegistered : textContent[selectedLanguage].userStatusGuest}
                </p>
                <p className="mt-1">
                  {textContent[selectedLanguage].queriesToday} {dailyQueryCount} / {currentLimit}
                </p>
              </div>
            )}

            {/* Botones de Login/Logout */}
            <div className="w-full flex justify-center mb-6 gap-4">
              {userId && !isRegisteredUser ? ( // Si es un usuario anónimo, mostrar botón de login
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {textContent[selectedLanguage].loginButton} / {textContent[selectedLanguage].signupButton}
                </button>
              ) : ( // Si es un usuario registrado o ya logueado
                <button
                  onClick={handleSignOut}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {textContent[selectedLanguage].logoutButton}
                </button>
              )}
            </div>

            {/* Modal de Autenticación */}
            {showAuthModal && (
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-purple-700">
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">{textContent[selectedLanguage].loginTitle}</h2>
                  <input
                    type="email"
                    placeholder={textContent[selectedLanguage].emailLabel}
                    className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder={textContent[selectedLanguage].passwordLabel}
                    className="w-full p-3 mb-6 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex flex-col gap-4">
                    {isLoginMode ? (
                      <>
                        <button
                          onClick={handleEmailSignIn}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 transform hover:scale-105"
                        >
                          {textContent[selectedLanguage].loginButton}
                        </button>
                        <button
                          onClick={handleGoogleSignIn}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 transform hover:scale-105"
                        >
                          {textContent[selectedLanguage].googleLogin}
                        </button>
                        <p className="text-gray-400 text-center mt-2">
                          <button onClick={() => setIsLoginMode(false)} className="text-blue-400 hover:underline">
                            {textContent[selectedLanguage].toggleSignup}
                          </button>
                        </p>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleEmailSignUp}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 transform hover:scale-105"
                        >
                          {textContent[selectedLanguage].signupButton}
                        </button>
                        <p className="text-gray-400 text-center mt-2">
                          <button onClick={() => setIsLoginMode(true)} className="text-blue-400 hover:underline">
                            {textContent[selectedLanguage].toggleLogin}
                          </button>
                        </p>
                      </>
                    )}
                    <button
                      onClick={() => setShowAuthModal(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full mt-4"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción del rol de Xlerion */}
            <p className="text-md md:text-lg text-gray-400 mb-8 leading-relaxed">
              {textContent[selectedLanguage].description}
            </p>

            {/* User Input Area */}
            <div className="w-full mb-6">
              <textarea
                className="w-full p-4 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
                placeholder={textContent[selectedLanguage].placeholder}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => { // Added onKeyDown handler
                  if (e.key === 'Enter' && !e.shiftKey) { // Check for Enter key without Shift
                    e.preventDefault(); // Prevent default behavior (new line)
                    handleQuerySubmit(); // Call the submit function
                  }
                }}
                rows="4"
              ></textarea>
            </div>

            {/* Botones de acción (Consulta, Guardar, Voz) */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 w-full justify-center">
              <button
                onClick={handleQuerySubmit}
                disabled={isLoading || isQueryLimitReached} // Deshabilitar botón mientras carga o si se alcanza el límite
                className={`bg-gradient-to-r from-blue-600 to-teal-700 hover:from-blue-700 hover:to-teal-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-300
                  ${isLoading || isQueryLimitReached ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50`}
              >
                {isLoading ? textContent[selectedLanguage].consulting : textContent[selectedLanguage].consultButton}
              </button>
              <button
                onClick={handleSaveQuery}
                disabled={!userQuery.trim() || (!ensiUtulResponse.trim() && !chartData) || isLoading || isLoadingRecommendation} // Deshabilitar si no hay consulta/respuesta o si sigue cargando
                className={`bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-300
                  ${(!userQuery.trim() || (!ensiUtulResponse.trim() && !chartData) || isLoading || isLoadingRecommendation) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50`}
              >
                {textContent[selectedLanguage].saveButton}
              </button>
              <button
                onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                disabled={isLoading}
                className={`bg-gradient-to-r from-green-600 to-lime-700 hover:from-green-700 hover:to-lime-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-300
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isListening ? textContent[selectedLanguage].listening : textContent[selectedLanguage].voiceInput}
              </button>
            </div>

            {/* Mensaje de portapapeles */}
            {clipboardMessage && (
              <div className="bg-blue-900 bg-opacity-50 text-blue-300 p-3 rounded-lg mt-4 w-full max-w-lg border border-blue-700 animate-fade-in">
                <p>{clipboardMessage}</p>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-900 bg-opacity-50 text-red-300 p-3 rounded-lg mt-6 w-full max-w-lg border border-red-700">
                <p>{error}</p>
              </div>
            )}

            {/* Área de respuesta de Xlerion (texto o gráfico) */}
            {chartData ? (
                <ChartDisplay data={chartData} type={chartType} title={chartTitle} />
            ) : ensiUtulResponse && !error && (
              <div className="bg-gray-800 p-6 rounded-lg mt-8 w-full max-w-lg border border-teal-700 animate-fade-in text-left">
                <h3 className="text-xl font-semibold text-teal-300 mb-3">
                  {textContent[selectedLanguage].responseTitle}
                </h3>
                <div>
                  {ensiUtulResponse.split('\n').map((line, index) => {
                    const trimmedLine = line.trim();
                    // Comprobar si son elementos de lista (empiezan con *, - o número. seguido de espacio)
                    if (trimmedLine.match(/^(\*|-|\d+\.)\s/)) {
                      return (
                        <p key={index} className="text-lg text-gray-200 leading-relaxed italic ml-4 mb-1">
                          {trimmedLine}
                        </p>
                      );
                    } else if (trimmedLine) {
                      // Párrafo normal
                      return (
                        <p key={index} className="text-lg text-gray-200 leading-relaxed italic mb-2">
                          {trimmedLine}
                        </p>
                      );
                    }
                    return null; // Ignorar líneas vacías
                  })}
                </div>
                <button
                    onClick={() => speakText(ensiUtulResponse)}
                    disabled={isSpeaking}
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-4 transition-all duration-300 transform hover:scale-105
                    ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {textContent[selectedLanguage].speakResponse}
                </button>
              </div>
            )}

            {/* Área de visualización de la recomendación sintetizada */}
            {synthesizedRecommendation && !error && (
              <div className="bg-gray-800 p-6 rounded-lg mt-4 w-full max-w-lg border border-blue-700 animate-fade-in text-left">
                <h3 className="text-xl font-semibold text-blue-300 mb-3">
                  {textContent[selectedLanguage].recommendationTitle}
                </h3>
                <p className="text-lg text-gray-200 leading-relaxed italic">
                  {synthesizedRecommendation}
                </p>
                <button
                    onClick={() => speakText(synthesizedRecommendation)}
                    disabled={isSpeaking}
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-4 transition-all duration-300 transform hover:scale-105
                    ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {textContent[selectedLanguage].listen}
                </button>
              </div>
            )}

            {/* Historial de consultas guardadas */}
            <div className="w-full max-w-3xl mt-12 text-left">
              <h2 className="text-3xl font-bold text-teal-400 mb-6 border-b border-teal-700 pb-2">
                {textContent[selectedLanguage].historyTitle}
              </h2>
              {isLoadingSavedQueries ? (
                <p className="text-gray-400">{textContent[selectedLanguage].loadingHistory}</p>
              ) : savedQueries.length === 0 ? (
                <p className="text-gray-400">{textContent[selectedLanguage].noSavedQueries}</p>
              ) : (
                <div className="space-y-6">
                  {savedQueries.map((item) => (
                    <div key={item.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">
                          {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString(selectedLanguage === 'es' ? 'es-CO' : 'en-US') : textContent[selectedLanguage].dateUnknown}
                        </p>
                        <button
                          onClick={() => handleShareSavedQuery(item.query, item.response, item.synthesizedRecommendation, item.chartData, item.chartType, item.chartTitle)}
                          className="bg-gray-600 hover:bg-gray-500 text-white text-sm py-1 px-3 rounded-full shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          {textContent[selectedLanguage].shareQuery}
                        </button>
                      </div>
                      <h4 className="text-lg font-semibold text-blue-300 mb-2">{textContent[selectedLanguage].yourQuery}</h4>
                      <p className="text-gray-100 mb-3">{item.query}</p>
                      <button
                          onClick={() => speakText(item.query)}
                          disabled={isSpeaking}
                          className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full mt-2 transition-all duration-300 transform hover:scale-105 text-sm
                          ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                          {textContent[selectedLanguage].listen}
                      </button>
                      
                      {item.chartData ? (
                          <ChartDisplay data={item.chartData} type={item.chartType} title={item.chartTitle} />
                      ) : (
                        <>
                          <h4 className="text-lg font-semibold text-teal-300 mb-2 mt-4">{textContent[selectedLanguage].xlerionResponse}</h4>
                          <p className="text-gray-200 italic mb-3">{item.response}</p>
                          <button
                              onClick={() => speakText(item.response)}
                              disabled={isSpeaking}
                              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full mt-2 transition-all duration-300 transform hover:scale-105 text-sm
                              ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                              {textContent[selectedLanguage].listen}
                          </button>
                        </>
                      )}
                      
                      {item.synthesizedRecommendation && (
                        <>
                          <h4 className="text-lg font-semibold text-blue-300 mb-2 mt-4">{textContent[selectedLanguage].recommendationTitle}</h4>
                          <p className="text-gray-200 italic">{item.synthesizedRecommendation}</p>
                          <button
                              onClick={() => speakText(item.synthesizedRecommendation)}
                              disabled={isSpeaking}
                              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full mt-2 transition-all duration-300 transform hover:scale-105 text-sm
                              ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                              {textContent[selectedLanguage].listen}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie de página/créditos */}
            <p className="text-sm text-gray-500 mt-12">
              {textContent[selectedLanguage].conceptCredit}
            </p>
          </>
        ) : (
          <AdminPanel />
        )}
      </div>

      {/* Tailwind CSS CDN para estilos */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* CSS personalizado para animaciones */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            text-shadow: 0 0 5px rgba(74, 222, 128, 0.5), 0 0 15px rgba(74, 222, 128, 0.3);
          }
          50% {
            text-shadow: 0 0 10px rgba(74, 222, 128, 0.8), 0 0 25px rgba(74, 222, 128, 0.6);
          }
        }
        .animate-pulse {
          animation: pulse 2.5s infinite ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }

        /* Asegurar que la fuente Inter se cargue y aplique */
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default App;