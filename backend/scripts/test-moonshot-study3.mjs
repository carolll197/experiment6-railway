function pickBearerToken() {
  const k = process.env.MOONSHOT_API_KEY || process.env.MOONSHOT_KEY;
  if (!k) throw new Error('Missing env MOONSHOT_API_KEY (or MOONSHOT_KEY).');
  return k.trim();
}

async function main() {
  const key = pickBearerToken();
  const modelsToTry = [
    'kimi-k2-0905-preview',
    'kimi-k2-preview',
    'moonshot-v1-8k',
    'moonshot-v1-32k',
    'moonshot-v1-128k',
  ];

  for (const model of modelsToTry) {
    const body = {
      model,
      messages: [{ role: 'user', content: 'ping' }],
      temperature: 0,
    };

    const resp = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    console.log('model', model, 'status', resp.status);
    console.log(text.slice(0, 300));
    console.log('---');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

