import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Inspect explicitly supplied events only. Never watches, records, or stops a process. */
export function inspectLoops(input) {
  const { events, threshold = 3 } = input ?? {};
  if (!Array.isArray(events) || events.length > 200 || !Number.isInteger(threshold) || threshold < 2 || threshold > 20)
    throw new Error('Provide up to 200 events and an integer threshold from 2 to 20');
  let bytes = 0;
  for (const event of events) {
    if (!event || typeof event.operation !== 'string' || !event.operation.trim() || event.operation.length > 200 ||
        typeof event.input !== 'string' || typeof event.output !== 'string' ||
        (event.progress !== undefined && typeof event.progress !== 'boolean'))
      throw new Error('Each event needs operation, input, output strings and optional boolean progress');
    bytes += Buffer.byteLength(event.input) + Buffer.byteLength(event.output);
  }
  if (bytes > 1000000) throw new Error('Combined event input/output exceeds 1 MB');
  const groups = new Map();
  events.forEach((event, index) => {
    if (event.progress) { groups.clear(); return; }
    const key = JSON.stringify([event.operation, event.input, event.output]);
    const group = groups.get(key) ?? { operation: event.operation, indices: [] };
    group.indices.push(index); groups.set(key, group);
  });
  const repetitions = [...groups.values()].filter(group => group.indices.length >= threshold);
  return { status: repetitions.length ? 'repetition-detected' : 'no-repetition-detected', repetitions,
    inspectedEvents: events.length, threshold,
    action: repetitions.length ? 'Review repeated calls. Narrow the search, change the hypothesis, or report the blocker before retrying unchanged work.' : 'No exact repetition reached the threshold in the supplied events since the last explicit progress marker.',
    limitation: 'Exact operation/input/output repeats only; legitimate polling can repeat. Advisory only; no process control, transcript access, or persistent storage.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node watchdog.mjs <events.json|->');
    const raw = fs.readFileSync(process.argv[2] === '-' ? 0 : process.argv[2], 'utf8');
    if (Buffer.byteLength(raw) > 2000000) throw new Error('Input exceeds 2 MB');
    console.log(JSON.stringify(inspectLoops(JSON.parse(raw)), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
