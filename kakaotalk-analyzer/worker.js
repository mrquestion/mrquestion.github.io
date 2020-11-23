onmessage = e => {
  const { type, data } = e.data;
  if (type === 'analyze') {
    const lines = data.split('\n');
    postMessage({ type: 'start', response: { lines: lines.length } });

    const metadata = {
      unhandled: [],
    };
    const size = 10 ** 5;

    for (let i = 0; i < lines.length; i += size) {
      const messages = [];

      lines.slice(i, i + size).forEach((line, i) => {
        line = line.trim();
        if (line.endsWith(' 님과 카카오톡 대화')) {
          const m = line.match(/^(.*) (\d+) 님과 카카오톡 대화$/);
          const [ _, title, count ] = m;
          metadata.title = title;
          metadata.users = count;
          postMessage({ type: 'message', response: { text: title }});
        } else if (line.startsWith('저장한 날짜 : ')) {
          const m = line.match(/^저장한 날짜 : (\d+년 \d+월 \d+일 (오전|오후) \d+:\d+)$/);
          const [ _, time, __ ] = m;
          metadata.savedAt = time;
          postMessage({ type: 'message', response: { text: time }});
        } else if (m = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+)$/)) {
          const [ _, time, __ ] = m;
          metadata.joinedAt = time;
        } else if (m = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+), (.*) : (.*)$/)) {
          const [ _, time, __, name, text ] = m;
          messages.push({ time, name, text });
        } else if (m = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+), (.*)님이 (들어왔습니다|나갔습니다|내보냈습니다)\.$/)) {
          const [ _, time, __, name, event ] = m;
          messages.push({ time, name, event });
        } else if (line.length > 0 && messages.length > 0) {
          const message = messages.slice(-1).shift();
          message.text += `\n${line}`;
        } else if (line.length > 0) {
          metadata.unhandled.push(line);
        }
      });
      postMessage({ type: 'next', response: { messages } });
    }
    postMessage({ type: 'finish', response: { metadata } });
  }
};
