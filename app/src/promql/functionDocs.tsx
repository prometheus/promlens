import React from 'react';

const funcDocs: Record<string, React.ReactNode> = {
  abs: (
    <>
      <p>
        <code>abs(v instant-vector)</code> returns the input vector with all sample values converted to their absolute value.
      </p>
    </>
  ),
  absent: (
    <>
      <p>
        <code>absent(v instant-vector)</code> returns an empty vector if the vector passed to it has any elements and a
        1-element vector with the value 1 if the vector passed to it has no elements.
      </p>

      <p>This is useful for alerting on when no time series exist for a given metric name and label combination.</p>

      <pre>
        <code>
          absent(nonexistent{'{'}job=&quot;myjob&quot;{'}'}) # =&gt; {'{'}job=&quot;myjob&quot;{'}'}
          absent(nonexistent{'{'}job=&quot;myjob&quot;,instance=~&quot;.*&quot;{'}'}) # =&gt; {'{'}job=&quot;myjob&quot;{'}'}
          absent(sum(nonexistent{'{'}job=&quot;myjob&quot;{'}'})) # =&gt; {'{'}
          {'}'}
        </code>
      </pre>

      <p>
        In the first two examples, <code>absent()</code> tries to be smart about deriving labels of the 1-element output
        vector from the input vector.
      </p>
    </>
  ),
  absent_over_time: (
    <>
      <p>
        <code>absent_over_time(v range-vector)</code> returns an empty vector if the range vector passed to it has any
        elements and a 1-element vector with the value 1 if the range vector passed to it has no elements.
      </p>

      <p>
        This is useful for alerting on when no time series exist for a given metric name and label combination for a certain
        amount of time.
      </p>

      <pre>
        <code>
          absent_over_time(nonexistent{'{'}job=&quot;myjob&quot;{'}'}[1h]) # =&gt; {'{'}job=&quot;myjob&quot;{'}'}
          absent_over_time(nonexistent{'{'}job=&quot;myjob&quot;,instance=~&quot;.*&quot;{'}'}[1h]) # =&gt; {'{'}
          job=&quot;myjob&quot;{'}'}
          absent_over_time(sum(nonexistent{'{'}job=&quot;myjob&quot;{'}'})[1h:]) # =&gt; {'{'}
          {'}'}
        </code>
      </pre>

      <p>
        In the first two examples, <code>absent_over_time()</code> tries to be smart about deriving labels of the 1-element
        output vector from the input vector.
      </p>
    </>
  ),
  acos: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  acosh: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  asin: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  asinh: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  atan: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  atanh: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  avg_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  ceil: (
    <>
      <p>
        <code>ceil(v instant-vector)</code> rounds the sample values of all elements in <code>v</code> up to the nearest
        integer.
      </p>
    </>
  ),
  changes: (
    <>
      <p>
        For each input time series, <code>changes(v range-vector)</code> returns the number of times its value has changed
        within the provided time range as an instant vector.
      </p>
    </>
  ),
  clamp: (
    <>
      <p>
        <code>clamp(v instant-vector, min scalar, max scalar)</code>
        clamps the sample values of all elements in <code>v</code> to have a lower limit of <code>min</code> and an upper
        limit of <code>max</code>.
      </p>

      <p>
        Special cases: - Return an empty vector if <code>min &gt; max</code>- Return <code>NaN</code> if <code>min</code> or{' '}
        <code>max</code> is <code>NaN</code>
      </p>
    </>
  ),
  clamp_max: (
    <>
      <p>
        <code>clamp_max(v instant-vector, max scalar)</code> clamps the sample values of all elements in <code>v</code> to
        have an upper limit of <code>max</code>.
      </p>
    </>
  ),
  clamp_min: (
    <>
      <p>
        <code>clamp_min(v instant-vector, min scalar)</code> clamps the sample values of all elements in <code>v</code> to
        have a lower limit of <code>min</code>.
      </p>
    </>
  ),
  cos: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  cosh: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  count_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  day_of_month: (
    <>
      <p>
        <code>day_of_month(v=vector(time()) instant-vector)</code> returns the day of the month for each of the given times
        in UTC. Returned values are from 1 to 31.
      </p>
    </>
  ),
  day_of_week: (
    <>
      <p>
        <code>day_of_week(v=vector(time()) instant-vector)</code> returns the day of the week for each of the given times in
        UTC. Returned values are from 0 to 6, where 0 means Sunday etc.
      </p>
    </>
  ),
  days_in_month: (
    <>
      <p>
        <code>days_in_month(v=vector(time()) instant-vector)</code> returns number of days in the month for each of the given
        times in UTC. Returned values are from 28 to 31.
      </p>
    </>
  ),
  deg: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  delta: (
    <>
      <p>
        <code>delta(v range-vector)</code> calculates the difference between the first and last value of each time series
        element in a range vector <code>v</code>, returning an instant vector with the given deltas and equivalent labels.
        The delta is extrapolated to cover the full time range as specified in the range vector selector, so that it is
        possible to get a non-integer result even if the sample values are all integers.
      </p>

      <p>The following example expression returns the difference in CPU temperature between now and 2 hours ago:</p>

      <pre>
        <code>
          delta(cpu_temp_celsius{'{'}host=&quot;zeus&quot;{'}'}[2h])
        </code>
      </pre>

      <p>
        <code>delta</code> should only be used with gauges.
      </p>
    </>
  ),
  deriv: (
    <>
      <p>
        <code>deriv(v range-vector)</code> calculates the per-second derivative of the time series in a range vector{' '}
        <code>v</code>, using <a href="https://en.wikipedia.org/wiki/Simple_linear_regression">simple linear regression</a>.
      </p>

      <p>
        <code>deriv</code> should only be used with gauges.
      </p>
    </>
  ),
  exp: (
    <>
      <p>
        <code>exp(v instant-vector)</code> calculates the exponential function for all elements in <code>v</code>. Special
        cases are:
      </p>

      <ul>
        <li>
          <code>Exp(+Inf) = +Inf</code>
        </li>
        <li>
          <code>Exp(NaN) = NaN</code>
        </li>
      </ul>
    </>
  ),
  floor: (
    <>
      <p>
        <code>floor(v instant-vector)</code> rounds the sample values of all elements in <code>v</code> down to the nearest
        integer.
      </p>
    </>
  ),
  histogram_quantile: (
    <>
      <p>
        <code>histogram_quantile(φ scalar, b instant-vector)</code> calculates the φ-quantile (0 ≤ φ ≤ 1) from the buckets{' '}
        <code>b</code> of a<a href="https://prometheus.io/docs/concepts/metric_types/#histogram">histogram</a>. (See
        <a href="https://prometheus.io/docs/practices/histograms">histograms and summaries</a> for a detailed explanation of
        φ-quantiles and the usage of the histogram metric type in general.) The samples in <code>b</code> are the counts of
        observations in each bucket. Each sample must have a label <code>le</code> where the label value denotes the
        inclusive upper bound of the bucket. (Samples without such a label are silently ignored.) The{' '}
        <a href="https://prometheus.io/docs/concepts/metric_types/#histogram">histogram metric type</a>
        automatically provides time series with the <code>_bucket</code> suffix and the appropriate labels.
      </p>

      <p>
        Use the <code>rate()</code> function to specify the time window for the quantile calculation.
      </p>

      <p>
        Example: A histogram metric is called <code>http_request_duration_seconds</code>. To calculate the 90th percentile of
        request durations over the last 10m, use the following expression:
      </p>

      <pre>
        <code>histogram_quantile(0.9, rate(http_request_duration_seconds_bucket[10m]))</code>
      </pre>

      <p>
        The quantile is calculated for each label combination in
        <code>http_request_duration_seconds</code>. To aggregate, use the <code>sum()</code> aggregator around the{' '}
        <code>rate()</code> function. Since the <code>le</code> label is required by
        <code>histogram_quantile()</code>, it has to be included in the <code>by</code> clause. The following expression
        aggregates the 90th percentile by <code>job</code>:
      </p>

      <pre>
        <code>histogram_quantile(0.9, sum by (job, le) (rate(http_request_duration_seconds_bucket[10m])))</code>
      </pre>

      <p>
        To aggregate everything, specify only the <code>le</code> label:
      </p>

      <pre>
        <code>histogram_quantile(0.9, sum by (le) (rate(http_request_duration_seconds_bucket[10m])))</code>
      </pre>

      <p>
        The <code>histogram_quantile()</code> function interpolates quantile values by assuming a linear distribution within
        a bucket. The highest bucket must have an upper bound of <code>+Inf</code>. (Otherwise, <code>NaN</code> is
        returned.) If a quantile is located in the highest bucket, the upper bound of the second highest bucket is returned.
        A lower limit of the lowest bucket is assumed to be 0 if the upper bound of that bucket is greater than 0. In that
        case, the usual linear interpolation is applied within that bucket. Otherwise, the upper bound of the lowest bucket
        is returned for quantiles located in the lowest bucket.
      </p>

      <p>
        If <code>b</code> has 0 observations, <code>NaN</code> is returned. If <code>b</code> contains fewer than two
        buckets,
        <code>NaN</code> is returned. For φ &lt; 0, <code>-Inf</code> is returned. For φ &gt; 1, <code>+Inf</code> is
        returned.
      </p>
    </>
  ),
  holt_winters: (
    <>
      <p>
        <code>holt_winters(v range-vector, sf scalar, tf scalar)</code> produces a smoothed value for time series based on
        the range in <code>v</code>. The lower the smoothing factor <code>sf</code>, the more importance is given to old
        data. The higher the trend factor <code>tf</code>, the more trends in the data is considered. Both <code>sf</code>{' '}
        and <code>tf</code> must be between 0 and 1.
      </p>

      <p>
        <code>holt_winters</code> should only be used with gauges.
      </p>
    </>
  ),
  hour: (
    <>
      <p>
        <code>hour(v=vector(time()) instant-vector)</code> returns the hour of the day for each of the given times in UTC.
        Returned values are from 0 to 23.
      </p>
    </>
  ),
  idelta: (
    <>
      <p>
        <code>idelta(v range-vector)</code> calculates the difference between the last two samples in the range vector{' '}
        <code>v</code>, returning an instant vector with the given deltas and equivalent labels.
      </p>

      <p>
        <code>idelta</code> should only be used with gauges.
      </p>
    </>
  ),
  increase: (
    <>
      <p>
        <code>increase(v range-vector)</code> calculates the increase in the time series in the range vector. Breaks in
        monotonicity (such as counter resets due to target restarts) are automatically adjusted for. The increase is
        extrapolated to cover the full time range as specified in the range vector selector, so that it is possible to get a
        non-integer result even if a counter increases only by integer increments.
      </p>

      <p>
        The following example expression returns the number of HTTP requests as measured over the last 5 minutes, per time
        series in the range vector:
      </p>

      <pre>
        <code>
          increase(http_requests_total{'{'}job=&quot;api-server&quot;{'}'}[5m])
        </code>
      </pre>

      <p>
        <code>increase</code> should only be used with counters. It is syntactic sugar for <code>rate(v)</code> multiplied by
        the number of seconds under the specified time range window, and should be used primarily for human readability. Use{' '}
        <code>rate</code> in recording rules so that increases are tracked consistently on a per-second basis.
      </p>
    </>
  ),
  irate: (
    <>
      <p>
        <code>irate(v range-vector)</code> calculates the per-second instant rate of increase of the time series in the range
        vector. This is based on the last two data points. Breaks in monotonicity (such as counter resets due to target
        restarts) are automatically adjusted for.
      </p>

      <p>
        The following example expression returns the per-second rate of HTTP requests looking up to 5 minutes back for the
        two most recent data points, per time series in the range vector:
      </p>

      <pre>
        <code>
          irate(http_requests_total{'{'}job=&quot;api-server&quot;{'}'}[5m])
        </code>
      </pre>

      <p>
        <code>irate</code> should only be used when graphing volatile, fast-moving counters. Use <code>rate</code> for alerts
        and slow-moving counters, as brief changes in the rate can reset the <code>FOR</code> clause and graphs consisting
        entirely of rare spikes are hard to read.
      </p>

      <p>
        Note that when combining <code>irate()</code> with an
        <a href="operators.md#aggregation-operators">aggregation operator</a> (e.g. <code>sum()</code>) or a function
        aggregating over time (any function ending in <code>_over_time</code>), always take a <code>irate()</code> first,
        then aggregate. Otherwise <code>irate()</code> cannot detect counter resets when your target restarts.
      </p>
    </>
  ),
  label_join: (
    <>
      <p>
        For each timeseries in <code>v</code>,{' '}
        <code>
          label_join(v instant-vector, dst_label string, separator string, src_label_1 string, src_label_2 string, ...)
        </code>{' '}
        joins all the values of all the <code>src_labels</code>
        using <code>separator</code> and returns the timeseries with the label <code>dst_label</code> containing the joined
        value. There can be any number of <code>src_labels</code> in this function.
      </p>

      <p>
        This example will return a vector with each time series having a <code>foo</code> label with the value{' '}
        <code>a,b,c</code> added to it:
      </p>

      <pre>
        <code>
          label_join(up{'{'}job=&quot;api-server&quot;,src1=&quot;a&quot;,src2=&quot;b&quot;,src3=&quot;c&quot;{'}'},
          &quot;foo&quot;, &quot;,&quot;, &quot;src1&quot;, &quot;src2&quot;, &quot;src3&quot;)
        </code>
      </pre>
    </>
  ),
  label_replace: (
    <>
      <p>
        For each timeseries in <code>v</code>,{' '}
        <code>label_replace(v instant-vector, dst_label string, replacement string, src_label string, regex string)</code>
        matches the regular expression <code>regex</code> against the value of the label <code>src_label</code>. If it
        matches, the value of the label <code>dst_label</code> in the returned timeseries will be the expansion of{' '}
        <code>replacement</code>, together with the original labels in the input. Capturing groups in the regular expression
        can be referenced with <code>$1</code>, <code>$2</code>, etc. If the regular expression doesn&rsquo;t match then the
        timeseries is returned unchanged.
      </p>

      <p>
        This example will return timeseries with the values <code>a:c</code> at label <code>service</code> and <code>a</code>{' '}
        at label <code>foo</code>:
      </p>

      <pre>
        <code>
          label_replace(up{'{'}job=&quot;api-server&quot;,service=&quot;a:c&quot;{'}'}, &quot;foo&quot;, &quot;$1&quot;,
          &quot;service&quot;, &quot;(.*):.*&quot;)
        </code>
      </pre>
    </>
  ),
  last_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  ln: (
    <>
      <p>
        <code>ln(v instant-vector)</code> calculates the natural logarithm for all elements in <code>v</code>. Special cases
        are:
      </p>

      <ul>
        <li>
          <code>ln(+Inf) = +Inf</code>
        </li>
        <li>
          <code>ln(0) = -Inf</code>
        </li>
        <li>
          <code>ln(x &lt; 0) = NaN</code>
        </li>
        <li>
          <code>ln(NaN) = NaN</code>
        </li>
      </ul>
    </>
  ),
  log10: (
    <>
      <p>
        <code>log10(v instant-vector)</code> calculates the decimal logarithm for all elements in <code>v</code>. The special
        cases are equivalent to those in <code>ln</code>.
      </p>
    </>
  ),
  log2: (
    <>
      <p>
        <code>log2(v instant-vector)</code> calculates the binary logarithm for all elements in <code>v</code>. The special
        cases are equivalent to those in <code>ln</code>.
      </p>
    </>
  ),
  max_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  min_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  minute: (
    <>
      <p>
        <code>minute(v=vector(time()) instant-vector)</code> returns the minute of the hour for each of the given times in
        UTC. Returned values are from 0 to 59.
      </p>
    </>
  ),
  month: (
    <>
      <p>
        <code>month(v=vector(time()) instant-vector)</code> returns the month of the year for each of the given times in UTC.
        Returned values are from 1 to 12, where 1 means January etc.
      </p>
    </>
  ),
  pi: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  predict_linear: (
    <>
      <p>
        <code>predict_linear(v range-vector, t scalar)</code> predicts the value of time series
        <code>t</code> seconds from now, based on the range vector <code>v</code>, using{' '}
        <a href="https://en.wikipedia.org/wiki/Simple_linear_regression">simple linear regression</a>.
      </p>

      <p>
        <code>predict_linear</code> should only be used with gauges.
      </p>
    </>
  ),
  present_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  quantile_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  rad: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  rate: (
    <>
      <p>
        <code>rate(v range-vector)</code> calculates the per-second average rate of increase of the time series in the range
        vector. Breaks in monotonicity (such as counter resets due to target restarts) are automatically adjusted for. Also,
        the calculation extrapolates to the ends of the time range, allowing for missed scrapes or imperfect alignment of
        scrape cycles with the range&rsquo;s time period.
      </p>

      <p>
        The following example expression returns the per-second rate of HTTP requests as measured over the last 5 minutes,
        per time series in the range vector:
      </p>

      <pre>
        <code>
          rate(http_requests_total{'{'}job=&quot;api-server&quot;{'}'}[5m])
        </code>
      </pre>

      <p>
        <code>rate</code> should only be used with counters. It is best suited for alerting, and for graphing of slow-moving
        counters.
      </p>

      <p>
        Note that when combining <code>rate()</code> with an aggregation operator (e.g. <code>sum()</code>) or a function
        aggregating over time (any function ending in <code>_over_time</code>), always take a <code>rate()</code> first, then
        aggregate. Otherwise <code>rate()</code> cannot detect counter resets when your target restarts.
      </p>
    </>
  ),
  resets: (
    <>
      <p>
        For each input time series, <code>resets(v range-vector)</code> returns the number of counter resets within the
        provided time range as an instant vector. Any decrease in the value between two consecutive samples is interpreted as
        a counter reset.
      </p>

      <p>
        <code>resets</code> should only be used with counters.
      </p>
    </>
  ),
  round: (
    <>
      <p>
        <code>round(v instant-vector, to_nearest=1 scalar)</code> rounds the sample values of all elements in <code>v</code>{' '}
        to the nearest integer. Ties are resolved by rounding up. The optional <code>to_nearest</code> argument allows
        specifying the nearest multiple to which the sample values should be rounded. This multiple may also be a fraction.
      </p>
    </>
  ),
  scalar: (
    <>
      <p>
        Given a single-element input vector, <code>scalar(v instant-vector)</code> returns the sample value of that single
        element as a scalar. If the input vector does not have exactly one element, <code>scalar</code> will return{' '}
        <code>NaN</code>.
      </p>
    </>
  ),
  sgn: (
    <>
      <p>
        <code>sgn(v instant-vector)</code> returns a vector with all sample values converted to their sign, defined as this:
        1 if v is positive, -1 if v is negative and 0 if v is equal to zero.
      </p>
    </>
  ),
  sin: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  sinh: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  sort: (
    <>
      <p>
        <code>sort(v instant-vector)</code> returns vector elements sorted by their sample values, in ascending order.
      </p>
    </>
  ),
  sort_desc: (
    <>
      <p>
        Same as <code>sort</code>, but sorts in descending order.
      </p>
    </>
  ),
  sqrt: (
    <>
      <p>
        <code>sqrt(v instant-vector)</code> calculates the square root of all elements in <code>v</code>.
      </p>
    </>
  ),
  stddev_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  stdvar_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  sum_over_time: (
    <>
      <p>
        The following functions allow aggregating each series of a given range vector over time and return an instant vector
        with per-series aggregation results:
      </p>

      <ul>
        <li>
          <code>avg_over_time(range-vector)</code>: the average value of all points in the specified interval.
        </li>
        <li>
          <code>min_over_time(range-vector)</code>: the minimum value of all points in the specified interval.
        </li>
        <li>
          <code>max_over_time(range-vector)</code>: the maximum value of all points in the specified interval.
        </li>
        <li>
          <code>sum_over_time(range-vector)</code>: the sum of all values in the specified interval.
        </li>
        <li>
          <code>count_over_time(range-vector)</code>: the count of all values in the specified interval.
        </li>
        <li>
          <code>quantile_over_time(scalar, range-vector)</code>: the φ-quantile (0 ≤ φ ≤ 1) of the values in the specified
          interval.
        </li>
        <li>
          <code>stddev_over_time(range-vector)</code>: the population standard deviation of the values in the specified
          interval.
        </li>
        <li>
          <code>stdvar_over_time(range-vector)</code>: the population standard variance of the values in the specified
          interval.
        </li>
        <li>
          <code>last_over_time(range-vector)</code>: the most recent point value in specified interval.
        </li>
        <li>
          <code>present_over_time(range-vector)</code>: the value 1 for any series in the specified interval.
        </li>
      </ul>

      <p>
        Note that all values in the specified interval have the same weight in the aggregation even if the values are not
        equally spaced throughout the interval.
      </p>
    </>
  ),
  tan: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  tanh: (
    <>
      <p>The trigonometric functions work in radians:</p>

      <ul>
        <li>
          <code>acos(v instant-vector)</code>: calculates the arccosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acos">special cases</a>).
        </li>
        <li>
          <code>acosh(v instant-vector)</code>: calculates the inverse hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Acosh">special cases</a>).
        </li>
        <li>
          <code>asin(v instant-vector)</code>: calculates the arcsine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asin">special cases</a>).
        </li>
        <li>
          <code>asinh(v instant-vector)</code>: calculates the inverse hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Asinh">special cases</a>).
        </li>
        <li>
          <code>atan(v instant-vector)</code>: calculates the arctangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atan">special cases</a>).
        </li>
        <li>
          <code>atanh(v instant-vector)</code>: calculates the inverse hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Atanh">special cases</a>).
        </li>
        <li>
          <code>cos(v instant-vector)</code>: calculates the cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cos">special cases</a>).
        </li>
        <li>
          <code>cosh(v instant-vector)</code>: calculates the hyperbolic cosine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Cosh">special cases</a>).
        </li>
        <li>
          <code>sin(v instant-vector)</code>: calculates the sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sin">special cases</a>).
        </li>
        <li>
          <code>sinh(v instant-vector)</code>: calculates the hyperbolic sine of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Sinh">special cases</a>).
        </li>
        <li>
          <code>tan(v instant-vector)</code>: calculates the tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tan">special cases</a>).
        </li>
        <li>
          <code>tanh(v instant-vector)</code>: calculates the hyperbolic tangent of all elements in <code>v</code> (
          <a href="https://pkg.go.dev/math#Tanh">special cases</a>).
        </li>
      </ul>

      <p>The following are useful for converting between degrees and radians:</p>

      <ul>
        <li>
          <code>deg(v instant-vector)</code>: converts radians to degrees for all elements in <code>v</code>.
        </li>
        <li>
          <code>pi()</code>: returns pi.
        </li>
      </ul>
    </>
  ),
  time: (
    <>
      <p>
        <code>time()</code> returns the number of seconds since January 1, 1970 UTC. Note that this does not actually return
        the current time, but the time at which the expression is to be evaluated.
      </p>
    </>
  ),
  timestamp: (
    <>
      <p>
        <code>timestamp(v instant-vector)</code> returns the timestamp of each of the samples of the given vector as the
        number of seconds since January 1, 1970 UTC.
      </p>

      <p>
        <em>This function was added in Prometheus 2.0</em>
      </p>
    </>
  ),
  vector: (
    <>
      <p>
        <code>vector(s scalar)</code> returns the scalar <code>s</code> as a vector with no labels.
      </p>
    </>
  ),
  year: (
    <>
      <p>
        <code>year(v=vector(time()) instant-vector)</code> returns the year for each of the given times in UTC.
      </p>
    </>
  ),
};

export default funcDocs;
