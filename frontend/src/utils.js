/* src/utils.js — shared formatting + small helpers */

export function fmtCurrency(value) {
  return "$" + Number(value).toFixed(2);
}

export function fmtDate(value) {
  if (!value) return "—";
  return value.split(".")[0].replace("T", " ");
}

export function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
