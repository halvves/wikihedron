export default (n, minIn, maxIn, minOut, maxOut, exponent) => {
  n -= minIn;
  n /= maxIn - minIn;
  n = Math.pow(n, exponent);
  n *= maxOut - minOut;
  n += minOut;
  return n;
}
