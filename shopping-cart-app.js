const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

//main cart
let cart = [];
//buttonsDOM initialized here, assigned once we run getBagButtons()
let buttonsDOM = [];

//gets the product
class Products {
    async getProducts() {
        try {
            let result = await fetch("products.json");
            let data = await result.json();
            let products = data.items;
            products = products.map((item) => {
                //destructuring object items to create key:value pair to use only what we need
                const { title, price } = item.fields;
                const { id } = item.sys;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image };
            });
            // console.log(products);
            return products;
        } catch (err) {
            console.log(err, "error");
        }
    }
}

//display products
class UI {
    displayProducts(products) {
        let result = "";
        products.forEach((product) => {
            //adds each iteration
            result += `
      <article class="product">
      <div class="img-container">
      <img src=${product.image} alt="" class="product-img" />
      <button class="bag-btn" data-id=${product.id}>
      <i class="fas fa-shopping-cart"></i>
      add to bag
      </button>
      </div>
      <h3>${product.title}</h3>
      <h4>$${product.price}</h4>
      </article>
      `;
        });
        // console.log(products);
        productsDOM.innerHTML = result;
    }
    getBagButtons() {
        //spread op to turns from node list into array to select all buttons
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;

        buttons.forEach((button) => {
            let id = button.dataset.id;
            let inCart = cart.find((item) => item.id === id);
            if (inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener("click", (e) => {
                e.target.innerText = "In Cart";
                e.target.disabled = true;
                //spread cartItem and add additional property, amount
                //totals math can now be applied using amount property
                let cartItem = { ...Storage.getProduct(id), amount: 1 };
                // console.log(cartItem);
                //spread cart into new array adding cartItem prop each time into obj holding all cart items
                cart = [...cart, cartItem];
                // console.log(cart);
                //save cart in local storage
                Storage.saveCart(cart);
                //set cart value
                //this points to button
                this.setCartValues(cart);
                //display cart items
                this.addCartItem(cartItem);
                //show cart overlay
                this.showCart();
            });
        });
    }
    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map((itemInCart) => {
            //setting up var to hold tempTotal as we multiply price * amount each cart item we loop thru
            tempTotal += itemInCart.price * itemInCart.amount;
            itemsTotal += itemInCart.amount;
        });
        //parseFloat turns string into a number
        //cuts off floating numbers at 2 decimal places
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
        // console.log(cartTotal, cartItems);
    }
    addCartItem(item) {
        const cartDiv = document.createElement("div");
        cartDiv.classList.add("cart-item");
        cartDiv.innerHTML = `
            <img src=${item.image} alt="${item.title} image" />
            <div>
                <h4>${item.title}</h4>
                <h5>$${item.price}</h5>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
                <p class="item-amount">${item.amount}</p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
        `;
        cartContent.appendChild(cartDiv);
        // console.log(cartContent);
    }
    showCart() {
        cartOverlay.classList.add("transparentBcg");
        cartDOM.classList.add("showCart");
    }
    setupAPP() {
        //grab values from cart (whether from local storage or an empty array)
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener("click", this.showCart);
        closeCartBtn.addEventListener("click", this.hideCart);
    }
    populateCart(cart) {
        cart.forEach((item) => this.addCartItem(item));
    }
    hideCart() {
        cartOverlay.classList.remove("transparentBcg");
        cartDOM.classList.remove("showCart");
    }
    cartLogic() {
        //clear cart button
        clearCartBtn.addEventListener("click", () => {
            //this as a callback will now point to ui class
            //accessing dom elements is not so important, but classes the this changes
            this.clearCart();
        });
        //cart functionality
        //putting event listener allows multiple events from single listener thats always there
        cartContent.addEventListener("click", (e) => {
            if (e.target.classList.contains("remove-item")) {
                let removeItem = e.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                //removes item from cart
                this.removeItem(id);
            } else if (e.target.classList.contains("fa-chevron-up")) {
                let addAmount = e.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find((item) => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if (e.target.classList.contains("fa-chevron-down")) {
                let subAmount = e.target;
                let id = subAmount.dataset.id;
                let tempItem = cart.find((item) => item.id === id);
                tempItem.amount = tempItem.amount - 1;

                if (tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    subAmount.previousElementSibling.innerText =
                        tempItem.amount;
                } else {
                    cartContent.removeChild(
                        subAmount.parentElement.parentElement
                    );
                    this.removeItem(id);
                }
            }
        });
    }
    clearCart() {
        // console.log(this);
        //grab all ids of items in cart
        let cartItems = cart.map((item) => item.id);
        //loop over cartItems and uses removeItem method on that item
        cartItems.forEach((id) => this.removeItem(id));
        // console.log(cartContent.children);
        //while there are any items in the cart
        while (cartContent.children.length > 0) {
            //remove first index of cart if possible
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    removeItem(id) {
        //seperating out functionality to reuse later
        //loop over cart items and filter out the ones that dont have matching id
        //removes single item instead of whole array
        cart = cart.filter((item) => item.id !== id);
        //carts value will = last value of cart
        this.setCartValues(cart);
        Storage.saveCart(cart);
        //grabs buttons array and passes in removeItems id
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `
        <i class="fas fa-shopping-cart"></i>add to cart
        `;
    }
    getSingleButton(id) {
        //grabs button from array where id matches
        return buttonsDOM.find((button) => button.dataset.id === id);
    }
}

//stores the product
class Storage {
    static saveProducts(products) {
        //first assign key to local storage
        //then local storage must be saved as string
        localStorage.setItem("products", JSON.stringify(products));
    }
    //save cart in local storage
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    //get product from products using dataset to match products
    static getProduct(id) {
        //parse back into json from local storage, assign to products array
        let products = JSON.parse(localStorage.getItem("products"));
        //add product to cart
        //connecting click event of buttons forEach loop to id of products in storage to know which products was clicked
        //product.id pulled from dataset
        return products.find((product) => product.id === id);
    }
    static getCart() {
        return localStorage.getItem("cart")
            ? //if true return cart from local storage
              JSON.parse(localStorage.getItem("cart"))
            : //otherwise return an empty array
              [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();

    //setup app
    ui.setupAPP();

    //get all products, awaiting aync promise
    products
        .getProducts()
        .then((products) => {
            ui.displayProducts(products);
            Storage.saveProducts(products);
        })
        .then(() => {
            //once we return products promise we can setup buttons once for all buttons
            ui.getBagButtons();
            ui.cartLogic();
        });
});
