import React, { useState, useEffect } from 'react';
// Import necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  const [clipboardMessage, setClipboardMessage] = useState(""); // Mensaje de copiado al portapapeles
  const [appIdForFirestore, setAppIdForFirestore] = useState(null); // ID de la aplicación para rutas de Firestore

  // Límites de consultas
  const GUEST_QUERY_LIMIT = 5;
  const REGISTERED_QUERY_LIMIT = 100; // Límite para usuarios registrados (prácticamente ilimitado para demo)

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
      shareFailed: "No se pudo compartir. Copia el contenido manualmente."
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
      shareFailed: "Could not share. Please copy content manually."
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
          setIsRegisteredUser(!!initialAuthToken);
        } else {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
              setIsRegisteredUser(true);
            } else {
              await signInAnonymously(firebaseAuth);
              setIsRegisteredUser(false);
            }
          } catch (authError) {
            console.error("Error durante el inicio de sesión anónimo o con token personalizado:", authError);
            setError("Error de autenticación de Firebase: " + authError.message + ". Revisa tu clave API de Firebase y el método de inicio de sesión anónimo."); // Mostrar error de autenticación más específico
            setUserId(crypto.randomUUID()); // Fallback a un UUID aleatorio
            setIsRegisteredUser(false);
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
      setAppIdForFirestore(null);
    }
  }, [selectedLanguage]);

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
    setError(""); // Limpiar errores previos

    try {
      // Definir el prompt para la API de Gemini según el idioma seleccionado.
      const basePromptEs = `Actúa como Xlerion, una inteligencia artificial avanzada con conocimiento profundo en todos los campos importantes para el manejo óptimo de sociedades.
                      Tu objetivo es ser una fuente de información creíble y confiable para los seres humanos, respondiendo de manera formal, objetiva y comprensible.
                      Tienes conocimiento profundo en todos los campos importantes para el manejo óptimo de sociedades,
                      especialmente en el contexto de Colombia (economía, salud, educación, seguridad, infraestructura, medio ambiente, etc.).
                      Responde a la siguiente consulta con sabiduría, visión holística y relevancia para Colombia.
                      Mantén la respuesta concisa y directiva.
                      Si la respuesta incluye puntos o enumeraciones, formatéalos claramente con guiones o números.`;

      const basePromptEn = `Act as Xlerion, an advanced artificial intelligence with deep knowledge in all fields important for the optimal management of societies.
                      Your goal is to be a credible and trustworthy source of information for humans, responding formally, objectively, and understandably.
                      You possess deep knowledge in all fields important for the optimal management of societies,
                      especially in the context of Colombia (economy, health, education, security, infrastructure, environment, etc.).
                      Respond to the following query with wisdom, holistic vision, and relevance to Colombia.
                      Keep the response concise and directive.
                      If the response includes points or enumerations, format them clearly with hyphens or numbers.`;

      const prompt = `${selectedLanguage === "es" ? basePromptEs : basePromptEn}\n\nConsulta: "${userQuery}"`;

      // Preparar el historial de chat para la solicitud a la API.
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

      const result = await response.json();
      console.log("Respuesta de la API de Gemini para consulta principal:", result); // Log de depuración

      // Verificar si la respuesta contiene contenido válido.
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setEnsiUtulResponse(text); // Actualizar el estado con la respuesta de Xlerion.

        // Incrementar el contador de consultas diarias después de una consulta exitosa
        const appId = appIdForFirestore;
        const today = getTodayDate();
        const queryCountRef = doc(db, `artifacts/${appId}/users/${userId}/dailyQueryLimit`, today);
        await setDoc(queryCountRef, { count: (dailyQueryCount || 0) + 1 }, { merge: true });

        // Después de obtener la respuesta principal, generar la recomendación sintetizada
        generateSynthesizedRecommendation(userQuery, text);

      } else {
        setEnsiUtulResponse(textContent[selectedLanguage].noClearResponse); // Mostrar error si falta contenido.
      }
    } catch (error) {
      // Registrar y mostrar un mensaje de error si la llamada a la API falla.
      console.error("Error al llamar a la API de Gemini:", error);
      setError(textContent[selectedLanguage].apiError + ": " + error.message); // Mostrar error en UI
      setEnsiUtulResponse(""); // Limpiar mensaje de carga en caso de error.
    } finally {
      setIsLoading(false); // Restablecer estado de carga independientemente del éxito o fracaso.
    }
  };

  /**
   * Guarda la consulta actual y la respuesta de Xlerion en Firestore.
   */
  const handleSaveQuery = async () => {
    if (!db || !userId || !appIdForFirestore) {
      setError(textContent[selectedLanguage].dbNotReady + ". Asegúrate de que Firebase esté inicializado y tengas un ID de usuario.");
      return;
    }
    if (!userQuery.trim() || !ensiUtulResponse.trim()) {
      setError(textContent[selectedLanguage].noQueryOrResponse);
      return;
    }

    try {
      const appId = appIdForFirestore;
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/xlerionQueries`), {
        query: userQuery,
        response: ensiUtulResponse,
        synthesizedRecommendation: synthesizedRecommendation, // Guardar la recomendación sintetizada
        timestamp: serverTimestamp() // Usar el timestamp del servidor de Firestore
      });
      setError(""); // Limpiar errores previos después de guardar exitosamente
      // Opcionalmente, limpiar la consulta/respuesta actual después de guardar
      // setUserQuery("");
      // setEnsiUtulResponse("");
      // setSynthesizedRecommendation("");
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
  const handleShareSavedQuery = async (queryText, responseText, recommendationText) => {
    let contentToShare = `${textContent[selectedLanguage].yourQuery}\n${queryText}\n\n${textContent[selectedLanguage].xlerionResponse}\n${responseText}`;
    if (recommendationText) {
      contentToShare += `\n\n${textContent[selectedLanguage].recommendationTitle}\n${recommendationText}`;
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4 font-inter">
      <div className="max-w-3xl w-full bg-gray-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-purple-800 flex flex-col items-center text-center">
        {/* Barra superior con Selector de Idioma y Botón de Compartir App */}
        <div className="w-full flex justify-between items-center mb-4">
          <select
            className="p-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          <button
            onClick={handleShareApp}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {textContent[selectedLanguage].shareApp}
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

        {/* Descripción del rol de Xlerion */}
        <p className="text-md md:text-lg text-gray-400 mb-8 leading-relaxed">
          {textContent[selectedLanguage].description}
        </p>

        {/* Área de entrada del usuario */}
        <div className="w-full mb-6">
          <textarea
            className="w-full p-4 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
            placeholder={textContent[selectedLanguage].placeholder}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            rows="4"
          ></textarea>
        </div>

        {/* Botones de acción */}
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
            disabled={!userQuery.trim() || !ensiUtulResponse.trim() || isLoading || isLoadingRecommendation} // Deshabilitar si no hay consulta/respuesta o si sigue cargando
            className={`bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-300
              ${(!userQuery.trim() || !ensiUtulResponse.trim() || isLoading || isLoadingRecommendation) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
              focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50`}
          >
            {textContent[selectedLanguage].saveButton}
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

        {/* Área de respuesta de Xlerion */}
        {ensiUtulResponse && !error && (
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
                      onClick={() => handleShareSavedQuery(item.query, item.response, item.synthesizedRecommendation)}
                      className="bg-gray-600 hover:bg-gray-500 text-white text-sm py-1 px-3 rounded-full shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {textContent[selectedLanguage].shareQuery}
                    </button>
                  </div>
                  <h4 className="text-lg font-semibold text-blue-300 mb-2">{textContent[selectedLanguage].yourQuery}</h4>
                  <p className="text-gray-100 mb-3">{item.query}</p>
                  <h4 className="text-lg font-semibold text-teal-300 mb-2">{textContent[selectedLanguage].xlerionResponse}</h4>
                  <p className="text-gray-200 italic mb-3">{item.response}</p>
                  {item.synthesizedRecommendation && (
                    <>
                      <h4 className="text-lg font-semibold text-blue-300 mb-2">{textContent[selectedLanguage].recommendationTitle}</h4>
                      <p className="text-gray-200 italic">{item.synthesizedRecommendation}</p>
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
