const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function eq(actual, expected, msg = "") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} expected ${e}, got ${a}`);
}

export function ok(cond, msg = "assertion failed") {
  if (!cond) throw new Error(msg);
}

export async function run() {
  const out = document.getElementById("results");
  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    const li = document.createElement("li");
    try {
      await t.fn();
      pass++;
      li.textContent = `ok   ${t.name}`;
    } catch (err) {
      fail++;
      li.textContent = `FAIL ${t.name}: ${err.message}`;
      li.className = "fail";
    }
    out.appendChild(li);
  }
  document.getElementById("summary").textContent = `PASS ${pass} / FAIL ${fail}`;
}
