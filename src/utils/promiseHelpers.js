export function promiseTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) =>{
      setTimeout(() => reject('Timed out'), timeout);
    })
  ]);
}