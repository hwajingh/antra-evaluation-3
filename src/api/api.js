export const Api = (() => {
  const baseUrl = "http://localhost:4232";
  const coursePath = "courseList";

  const getCourses = () =>
    fetch([baseUrl, coursePath].join("/")).then((response) => response.json());

  return {
    getCourses,
  };
})();
