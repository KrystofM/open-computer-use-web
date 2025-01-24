export async function* ndjsonStream(response: Response) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
  
    if (!reader) return;
  
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';
  
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed !== '') {
          try {
            yield JSON.parse(trimmed);
          } catch {
          }
        }
      }
    }
    if (buffer.trim() !== '') {
      try {
        yield JSON.parse(buffer);
      } catch {
      }
    }
  }