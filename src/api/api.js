export const Api = (() => {
  const baseUrl = "http://localhost:4232";
  const coursePath = "courseList";

  const getCourses = () =>
    fetch([baseUrl, coursePath].join("/")).then((response) => response.json());

  const deleteCourse = (id) =>
    fetch([baseUrl, coursePath, id].join("/"), {
      method: "DELETE",
    });

  return {
    getCourses,
    deleteCourse,
  };
})();
