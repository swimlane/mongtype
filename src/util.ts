/**
 * This will let you resolve a promise externally.
 * This is somewhat a hack and should only be used
 * for specific reasons.
 * 
 * This is used to create a promise for the connection
 * so that when the connect is called it can be resolved
 * externally by that fn when its happens.
 * 
 * Ref: http://lea.verou.me/2016/12/resolve-promises-externally-with-this-one-weird-trick/
 */
export function defer() {
  let res;
  let rej;

  const promise: any = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });

  promise.resolve = res;
  promise.reject = rej;
  return promise;
}