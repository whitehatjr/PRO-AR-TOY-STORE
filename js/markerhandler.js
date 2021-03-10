var uid = null;

AFRAME.registerComponent("markerhandler", {
  init: async function() {
    var toys = await this.getToys();
    if (uid === null) {
      this.askUserId();
    }

    this.el.addEventListener("markerFound", () => {
      if (uid !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(toys, markerId);
      }
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  handleMarkerFound: function(toys, markerId) {
    // Changing Model scale to initial scale
    var toy = toys.filter(toy => toy.id === markerId)[0];

    if (toy.is_out_of_stock) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is out of stock!!!",
        timer: 2500,
        buttons: false
      });
    } else {
      // make model visible
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("visible", true);

      // make plane Container visible
      var mainPlane = document.querySelector(`#main-plane-${toy.id}`);
      mainPlane.setAttribute("visible", true);

      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button");
      var ratingButton = document.getElementById("rating-button");

      // Handling Click Events
      orderButtton.addEventListener("click", () => {
        uid = uid.toUpperCase();
        this.handleOrder(uid, toy);

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "  ",
          timer: 2000,
          buttons: false
        });
      });

      orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );

      payButton.addEventListener("click", () => this.handlePayment());

      ratingButton.addEventListener("click", () => this.handleRatings(toy));
    }
  },
  askUserId: function() {
    var iconUrl =
      "https://raw.githubusercontent.com/whitehatjr/ar-toy-store-assets/master/toy-shop.png";

    swal({
      title: "Welcome to Toy Shop!!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your uid Ex:( U01 )"
        }
      }
    }).then(inputValue => {
      uid = inputValue;
    });
  },
  getToys: async function() {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  handleOrder: function(uid, toy) {
    // Reading current UID order details
    firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][toy.id]) {
          // Increasing Current Quantity
          details["current_orders"][toy.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][toy.id]["quantity"];

          details["current_orders"][toy.id]["subtotal"] =
            currentQuantity * toy.price;
        } else {
          details["current_orders"][toy.id] = {
            item: toy.toy_name,
            price: toy.price,
            quantity: 1,
            subtotal: toy.price * 1
          };
        }

        details.total_bill += toy.price;

        // Updating Db
        firebase
          .firestore()
          .collection("users")
          .doc(doc.id)
          .update(details);
      });
  },
  getorderSummary: async function(uid) {
    return await firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .get()
      .then(doc => doc.data());
  },
  handleOrderSummary: async function() {
    // Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";
    // Getting UID
    uid = uid.toUpperCase();

    // Getting Order summary from database
    var orderSummary = await this.getorderSummary(uid);

    var tableBodyTag = document.getElementById("bill-table-body");
    // Removing old tr data
    tableBodyTag.innerHTML = "";

    var currentOrders = Object.keys(orderSummary.current_orders);
    currentOrders.map(i => {
      var tr = document.createElement("tr");
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.current_orders[i].item;
      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);
      tableBodyTag.appendChild(tr);
    });

    var totalTr = document.createElement("tr");

    var td1 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td2 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td3 = document.createElement("td");
    td1.setAttribute("class", "no-line text-cente");

    var strongTag = document.createElement("strong");
    strongTag.innerHTML = "Total";
    td3.appendChild(strongTag);

    var td4 = document.createElement("td");
    td1.setAttribute("class", "no-line text-right");
    td4.innerHTML = "$" + orderSummary.total_bill;

    totalTr.appendChild(td1);
    totalTr.appendChild(td2);
    totalTr.appendChild(td3);
    totalTr.appendChild(td4);

    tableBodyTag.appendChild(totalTr);
  },
  handlePayment: function() {
    // Close Modal
    document.getElementById("modal-div").style.display = "none";

    // Getting UID
    uid = uid.toUpperCase();

    // Reseting current orders and total bill
    firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .update({
        current_orders: {},
        total_bill: 0
      })
      .then(() => {
        swal({
          icon: "success",
          title: "Thanks For Paying !",
          text: "We Hope You Like Your Toy !!",
          timer: 2500,
          buttons: false
        });
      });
  },

  handleRatings: function(toy) {
    // Close Modal
    document.getElementById("rating-modal-div").style.display = "flex";
    document.getElementById("rating-input").value = "0";

    var saveRatingButton = document.getElementById("save-rating-button");
    saveRatingButton.addEventListener("click", () => {
      document.getElementById("rating-modal-div").style.display = "none";
      var rating = document.getElementById("rating-input").value;

      firebase
        .firestore()
        .collection("toys")
        .doc(toy.id)
        .update({
          rating: rating
        })
        .then(() => {
          swal({
            icon: "success",
            title: "Thanks For Rating!",
            text: "We Hope You Like Toy !!",
            timer: 2500,
            buttons: false
          });
        });
    });
  },
  handleMarkerLost: function() {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
