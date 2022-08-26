import { Api } from "./api/api.js";

const View = (() => {
  const domstr = {
    availableCourses: "#availableCourses",
    selectedCourses: "#selectedCourses",
    course: ".course",
    totalCredit: "#totalCredit",
    select: "#select",
  };

  const render = (ele, tmp) => {
    ele.innerHTML = tmp;
  };

  const setBackground = (element, isSelected, isOdd) => {
    const originalColor = isOdd ? "white" : "rgb(221, 239, 221)";
    element.style.backgroundColor = isSelected ? "deepskyblue" : originalColor;
  };

  const createTmp = (arr) => {
    let tmp = "";

    arr.forEach((course) => {
      let typeOfCourse = course.required ? "Compulsory" : "Elective";
      tmp += `
        <li class="course" id="${course.courseId}">
          <span>${course.courseName}</span>
          <span>Course Type: ${typeOfCourse}</span>
          <span>Course Credit: ${course.credit}</span>
        </li>
      `;
    });
    return tmp;
  };

  return {
    render,
    domstr,
    createTmp,
    setBackground,
  };
})();

// MODEL
const Model = ((api, view) => {
  const { getCourses, deleteCourse } = api;

  class Course {
    constructor(id, name, required, credit) {
      this.id = id;
      this.courseName = name;
      this.courseRequired = required;
      this.courseCredit = credit;
    }
  }

  class State {
    #availableCourses = [];
    #tempCourses = [];
    #selectedCourses = [];
    #totalCredit = 0;

    get availableCourses() {
      return this.#availableCourses;
    }

    get tempCourses() {
      return this.#tempCourses;
    }

    get selectedCourses() {
      return this.#selectedCourses;
    }

    set availableCourses(newlist) {
      this.#availableCourses = [...newlist];

      const availableContainer = document.querySelector(
        view.domstr.availableCourses
      );
      const tmp = view.createTmp(this.#availableCourses);
      view.render(availableContainer, tmp);
    }

    setSelectedCourses(newlist) {
      this.#selectedCourses = [...newlist];

      const selectedContainer = document.querySelector(
        view.domstr.selectedCourses
      );
      const tmp = view.createTmp(this.#selectedCourses);
      view.render(selectedContainer, tmp);
    }

    setTempCourses(newlist) {
      this.#tempCourses = [...newlist];
    }

    setTotalCredit(credit) {
      this.#totalCredit = credit;
      const creditText = document.querySelector(view.domstr.totalCredit);

      view.render(creditText, this.#totalCredit);
    }

    setElementBackground(element, isSelected, isOdd) {
      view.setBackground(element, isSelected, isOdd);
    }
  }

  return { getCourses, deleteCourse, State, Course };
})(Api, View);

//controller
const Controller = ((model, view) => {
  const state = new model.State();

  const setDefaultCredit = () => {
    state.setTotalCredit(0);
  };

  const addToSelected = () => {
    const selectButton = document.querySelector(view.domstr.select);

    selectButton.addEventListener("click", () => {
      const courseMap = state.availableCourses.reduce((acc, curr) => {
        acc[curr.courseId] = curr;
        return acc;
      }, {});
      const credits = state.tempCourses.reduce((acc, curr) => {
        acc += courseMap[curr.id].credit;
        return acc;
      }, 0);

      let text =
        "You have chosen " +
        credits +
        " credits for this semester. You cannot change once you submit. Do you want to confirm?";
      if (confirm(text) == true) {
        const coursesToAdd = state.tempCourses;
        state.setSelectedCourses(coursesToAdd);
        state.setTempCourses([]);
        selectButton.disabled = true;
      } else {
        text = "You canceled!";
      }
    });
  };

  const addCourseSelectEvent = () => {
    const availableContainer = document.querySelector(
      view.domstr.availableCourses
    );
    availableContainer.addEventListener("click", (event) => {
      if (event.target.className === "course") {
        const chosenId = parseInt(event.target.id);

        // ------- GET THE COURSE --------
        const courseMap = state.availableCourses.reduce((acc, curr) => {
          acc[curr.courseId] = curr;
          return acc;
        }, {});

        const { courseId, courseName, required, credit } = courseMap[chosenId];
        const course = new model.Course(courseId, courseName, required, credit);

        // ------- PUT THE COURSE IN THE STATE & STYLE BACKGROUND --------
        const isCourseIncluded =
          state.tempCourses.filter((course) => course.id === chosenId).length >
          0;

        const element = document.getElementById(chosenId);
        state.setElementBackground(element, !isCourseIncluded, chosenId % 2);

        if (isCourseIncluded) {
          const newCourses = state.tempCourses.filter(
            (course) => course.id !== chosenId
          );
          state.setTempCourses([...newCourses]);
        } else {
          state.setTempCourses([course, ...state.tempCourses]);
        }

        // ------- CALCULATE THE COURSE CREDIT --------
        const credits = state.tempCourses.reduce((acc, curr) => {
          acc += courseMap[curr.id].credit;
          return acc;
        }, 0);

        if (credits > 18) {
          alert("You can only choose up to 18 credits in one semester");
        } else {
          state.setTotalCredit(credits);
        }
      }
    });
  };

  const init = () => {
    model.getCourses().then((courses) => {
      state.availableCourses = courses;
    });
  };

  const bootstrap = () => {
    init();
    addCourseSelectEvent();
    addToSelected();
    setDefaultCredit();
  };

  return { bootstrap };
})(Model, View);

Controller.bootstrap();
