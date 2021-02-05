const myUl = document.querySelector("#gif-container")
const addSelect = document.querySelector("#add-id-category-gif")
const searchSelect = document.querySelector("#select-search-categorie")
const labelMessage = document.querySelector('#message')
const searchBar = document.querySelector('#search-bar')

const arrayMessage = ["Gif ajouté !", "Gif invalide !"]
const arrayMessageClass = ["valid", "error"]

const wait = (delay) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, delay);
    })
}

const resetInput = (selector) => {
    document.querySelector(selector).value = ""
}

const messageError = (message, messageClass) => {
    console.log(message)
    labelMessage.innerHTML = message
    labelMessage.classList.add(messageClass)

    wait(3000).then(() => {
        labelMessage.innerHTML = ""
        labelMessage.classList.remove(messageClass)
    })
}

// Function fficher une categorie
const chooseWitchCategoryToShow = (myValue, addOrToggle = false, removeDisplayNone = false) => {
    const allLiGif = Array.from(document.querySelector("#gif-container").children)

    if (removeDisplayNone) {
        allLiGif.forEach(gif => gif.classList.remove("display-none"))
    }

    const categories = allLiGif.filter(gif => {
        return gif.querySelector(".tag").dataset.categorieId !== myValue
    })

    const parseMyValue = parseInt(myValue)

    categories.forEach(category => {
        if ((parseMyValue === 0) && (addOrToggle === true)) {
            category.classList.remove("display-none")
        } else if (addOrToggle === true) {
            category.classList.add("display-none")
        } else if (addOrToggle === false) {
            category.classList.toggle("display-none")
        }
    })
}

axios.get('https://b1-gif-api.herokuapp.com/api/pictures?itemsPerPage=200&page=1')
    .then(response => {

        //------------------------------------ Save like ------------------------------------
        let saveLikes = []

        const saveLike = () => {
            localStorage.setItem("saveLikes", JSON.stringify(saveLikes))
        }

        if (localStorage.getItem("saveLikes")) {
            saveLikes = JSON.parse(localStorage.getItem("saveLikes"))
        }

        //------------------------------------- Gif creator ----------------------------------------------
        let allGif = response.data["hydra:member"]

        const gifCreator = (gif) => {
            myUl.innerHTML += `
             <li class="gif" id="${gif.id}" data-id-gif="${gif.id}">
                <img alt="" src="${gif.url}">
                <div class="like-container"><i class="lar la-heart unlike"></i>${gif.likes}</div>
                <p class="gif-title">Titre : ${gif.title}</p>
                <p data-categorie-id="${gif.category.id}" class="tag ${gif.category.name}">${gif.category.name}</p>
                <i class="las la-trash delete"></i>
             </li>`

            if (saveLikes.indexOf(gif.id) > -1) {
                let liDataIdGif = document.querySelector(`li[data-id-gif="${gif.id}"]`)
                liDataIdGif.querySelector(".like-container").innerHTML = `<i class="las la-heart like"></i>${gif.likes}`
            }
        }

        allGif.forEach(gif => {
            gifCreator(gif)
        })

        //-------------------------------- Create Selects --------------------------------

        axios.get('https://b1-gif-api.herokuapp.com/api/categories')
            .then(response => {
                const allCategories = response.data["hydra:member"]

                const selectOptionCreator = (whichSelect, categorie) => {
                    whichSelect.innerHTML += `<option value="${categorie.id}">${categorie.name}</option>`
                }

                allCategories.forEach(categorie => {
                    selectOptionCreator(addSelect, categorie)
                    selectOptionCreator(searchSelect, categorie)
                })

            })


        document.addEventListener('click', (e) => {

            let activeElement = e.target
            let activeParentElement = activeElement.parentElement
            const gifId = activeParentElement.parentElement.id

            //------------------------------- LikeFunction -------------------------------

            const likeFunction = (addOrRemove, heartIcon) => {
                let linkToAddOrRemoveLike = `https://b1-gif-api.herokuapp.com/api/pictures/${gifId}/${addOrRemove}`
                let linkToRefreshGif = `https://b1-gif-api.herokuapp.com/api/pictures/${gifId}`

                axios.put(linkToAddOrRemoveLike)
                    .then(() => {
                        axios.get(linkToRefreshGif)
                            .then(response => {
                                let gifRefresh = response.data

                                activeParentElement.innerHTML = `<i class="${heartIcon}"></i>${gifRefresh.likes}`
                            })
                    })
            }

            if (activeElement.classList.contains("unlike")) {
                likeFunction("addLike", "las la-heart like")
                const parse = parseInt(gifId)
                saveLikes.push(parse)
                console.log(saveLikes)
                saveLike()

            } else if (activeElement.classList.contains("like")) {
                likeFunction("removeLike", "lar la-heart unlike")
                saveLikes.splice(saveLikes.indexOf(gifId), 1)
                saveLike()
                console.log(saveLikes)
            }
            //------------------------------- RemoveGif ----------------------------------
            if (activeElement.classList.contains("delete")) {
                let toDeleteGifId = activeParentElement.id
                let linkToDelete = `https://b1-gif-api.herokuapp.com/api/pictures/${toDeleteGifId}`

                if (toDeleteGifId > 12) {
                    axios.delete(linkToDelete)
                        .then(() => {
                            activeParentElement.remove()
                        })
                } else {
                    console.log("PAS TOUCHE")
                }
            }

            // ----------------------------------- categories -----------------------------------
            if (activeElement.classList.contains("tag")) {
                chooseWitchCategoryToShow(activeElement.dataset.categorieId)
            }
        })

        // ------------------------------------------ select-search-categorie ------------------------------------
        document.querySelector("#select-search-categorie").addEventListener('change', (e) => {
            const activeValue = e.target.value
            chooseWitchCategoryToShow(activeValue, true, true)
        })

        // ------------------------------- addGif ----------------------------------------
        document.querySelector('#nav-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target)
            const addLinkGif = formData.get("add-link-gif")
            const addTitleGif = formData.get("add-title-gif")
            const addIdCategoryGif = formData.get("add-id-category-gif")

            if (addLinkGif.length > 15) {

                axios.post('https://b1-gif-api.herokuapp.com/api/pictures', {
                    "url": addLinkGif,
                    "title": addTitleGif,
                    "category": `/api/categories/${addIdCategoryGif}`,
                }).then((response) => {
                    gifCreator(response.data)

                    resetInput("#add-link-gif")
                    resetInput("#add-title-gif")

                    messageError(arrayMessage[0], arrayMessageClass[0])

                })

            } else {
                messageError(arrayMessage[1], arrayMessageClass[1])

                resetInput("#add-link-gif")
                resetInput("#add-title-gif")

            }
        })
        // --------------------------------- Search-Bar --------------------------------------
        searchBar.addEventListener('input', () => {
            let value = searchBar.value
            console.log(value)

            let allGifSearchBar = document.querySelectorAll(".gif")

            allGifSearchBar.forEach(gif => {
                let gifTitleBrut = gif.querySelector(".gif-title").innerHTML
                let gifTitle = gifTitleBrut.toLowerCase()
                console.log(gifTitle)

                if (gifTitle.includes(value)) {
                    gif.classList.remove("display-none")
                } else if (value === "") {
                    gif.classList.remove("display-none")
                } else {
                    gif.classList.add("display-none")
                }
            })
        })

        // ---------------------------------test event listener view --------------------------------------
        window.onscroll = function () {
            myFunction()
        };

        function myFunction() {
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                document.querySelector("body").style.backgroundColor = "#fff"
            } else {
                document.querySelector("body").style.backgroundColor = "#fff"
            }
        }


    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
    .then(function () {
        // always executed
    });





