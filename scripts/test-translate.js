import translate from 'google-translate-api-x';

async function test() {
  const res = await translate(['Hello world', 'My name is Bob', 'How are you?'], { to: 'es' });
  console.log(res.map(r => r.text));
}

test().catch(console.error);
