export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Принимаем запросы только методом POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Безопасно получаем API-ключ из переменных окружения, настроенных на Vercel
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      // Если ключ не найден на сервере, возвращаем ошибку
      throw new Error("API key not configured on server");
    }

    // Получаем данные (промпт) из тела запроса от нашего приложения
    const requestBody = await request.json();
    const { prompt, systemInstruction } = requestBody;

    // Формируем тело запроса для отправки в Google Gemini API
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    // Отправляем запрос в Google, используя наш секретный ключ
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Если Google вернул ошибку, пересылаем ее для отладки
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        throw new Error(`Gemini API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Отправляем успешный ответ от Google обратно нашему приложению
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // В случае любой другой ошибки, сообщаем об этом
    console.error('Error in serverless function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

