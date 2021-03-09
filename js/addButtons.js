AFRAME.registerComponent("createbuttons", {
  init: function() {
    // 1. Create the Order button
    var button1 = document.createElement("button");
    button1.innerHTML = "ORDER NOW";
    button1.setAttribute("id", "order-button");
    button1.setAttribute("class", "btn btn-warning ml-3 mr-3");

    // 2. Create the Bill button
    var button2 = document.createElement("button");
    button2.innerHTML = "ORDER SUMMERY";
    button2.setAttribute("id", "order-summery-button");
    button2.setAttribute("class", "btn btn-warning ml-3");

    // 3. Append somewhere
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.appendChild(button2);
    buttonDiv.appendChild(button1);
  }
});
