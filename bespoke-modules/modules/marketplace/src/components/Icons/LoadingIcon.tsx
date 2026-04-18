export default function () {
  return (
    <svg height="100px" preserveAspectRatio="xMidYMid" viewBox="0 0 100 100" width="100px">
      <circle cx="50" cy="50" fill="none" r="0" stroke="currentColor" strokeWidth="2">
        <animate
          attributeName="r"
          begin="0s"
          calcMode="spline"
          dur="1s"
          keySplines="0 0.2 0.8 1"
          keyTimes="0;1"
          repeatCount="indefinite"
          values="0;40"
        />
        <animate
          attributeName="opacity"
          begin="0s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0 0.8 1"
          keyTimes="0;1"
          repeatCount="indefinite"
          values="1;0"
        />
      </circle>
      <circle cx="50" cy="50" fill="none" r="0" stroke="currentColor" strokeWidth="2">
        <animate
          attributeName="r"
          begin="-0.5s"
          calcMode="spline"
          dur="1s"
          keySplines="0 0.2 0.8 1"
          keyTimes="0;1"
          repeatCount="indefinite"
          values="0;40"
        />
        <animate
          attributeName="opacity"
          begin="-0.5s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0 0.8 1"
          keyTimes="0;1"
          repeatCount="indefinite"
          values="1;0"
        />
      </circle>
    </svg>
  );
}
