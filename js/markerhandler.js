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

      // make description Container visible
      var descriptionContainer = document.querySelector(
        `#main-plane-${toy.id}`
      );
      descriptionContainer.setAttribute("visible", true);

      // make Price Plane visible
      var pricePlane = document.querySelector(`#price-plane-${toy.id}`);
      pricePlane.setAttribute("visible", true);

      // make Rating Plane visible
      var ratingPlane = document.querySelector(`#rating-plane-${toy.id}`);
      ratingPlane.setAttribute("visible", true);

      // make review Plane visible
      var reviewPlane = document.querySelector(`#review-plane-${toy.id}`);
      reviewPlane.setAttribute("visible", true);

      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var orderButtton = document.getElementById("order-button");
      var orderSummeryButtton = document.getElementById("order-summery-button");
      var payButton = document.getElementById("pay-button");

      // Handling Click Events
      orderButtton.addEventListener("click", () => {
        uid = uid.toUpperCase();
        this.handleOrder(uid, toy);

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "Your order will serve soon on your table!",
          timer: 2000,
          buttons: false
        });
      });

      orderSummeryButtton.addEventListener("click", () =>
        this.handleOrderSummery()
      );

      payButton.addEventListener("click", () => this.handlePayment());
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
  getOrderSummery: async function(uid) {
    return await firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .get()
      .then(doc => doc.data());
  },
  handleOrderSummery: async function() {
    // Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";
    // Getting UID
    uid = uid.toUpperCase();

    // Getting Order Summery from database
    var orderSummery = await this.getOrderSummery(uid);

    var tableBodyTag = document.getElementById("bill-table-body");
    // Removing old tr data
    tableBodyTag.innerHTML = "";

    var currentOrders = Object.keys(orderSummery.current_orders);
    currentOrders.map(i => {
      var tr = document.createElement("tr");
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummery.current_orders[i].item;
      price.innerHTML = "$" + orderSummery.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummery.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummery.current_orders[i].subtotal;
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
    td4.innerHTML = "₹" + orderSummery.total_bill;

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
  handleMarkerLost: function() {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
