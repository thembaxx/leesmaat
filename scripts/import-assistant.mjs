// Pin browser-compatible model artifacts. Large weights remain remote and on demand.
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chosen = [
  [
    'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
    'Compact reading assistant',
    'Apache-2.0',
    'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct',
  ],
  [
    'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    'Llama reading assistant',
    'Llama 3.2 Community Licence',
    'https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct',
  ],
].map(([id, name, licence, source]) => ({
  ...prebuiltAppConfig.model_list.find((m) => m.model_id === id),
  name,
  licence,
  source,
}));
writeFileSync('/tmp/leesmaat-assistant-models.json', JSON.stringify(chosen));
execFileSync('python3', ['scripts/pin-assistant.py'], { stdio: 'inherit' });
