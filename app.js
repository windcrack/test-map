let arShops = []

async function getData (){
    await fetch("./db.json")
      .then((res) => res.json())
      .then((data) => arShops.push(data));

    const cardBody = document.querySelector('.cards');
    let info = arShops[0].features;
    console.log(info);

    info.forEach((item) => {
        let card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = `
            <div class="card__body">
                <div class="card__title">${item.properties.balloonContent.title}</div>
                <div class="card__title">${item.properties.balloonContent.text}</div>
                <div class="card__button">
                    <button data-balloon-id="${item.id}">посмотреть на карте</button>
                </div>
            </div>
        `;

        cardBody.append(card);
    })
}
getData();

function mapWhereBuy() {
  const mapSelector = document.getElementById("map-contacts");
  const mapCenter = [55.773434, 37.493693];
  let mapData = arShops || [];

  function init() {
    console.log("mapData", mapData);
    let map = new ymaps.Map(mapSelector, {
        center: mapCenter,
        zoom: 8,
      }),
      objectManager = new ymaps.ObjectManager({
        clusterize: true,
        clusterOpenBalloonOnClick: false,
      });

    map.geoObjects.add(objectManager);

    objectManager.objects.events.add("balloonopen", function (e) {
      // Получим объект, на котором открылся балун.
      let id = e.get("objectId"),
        geoObject = objectManager.objects.getById(id);
      // Загрузим данные для объекта при необходимости.
      downloadContent([geoObject], id);
    });

    objectManager.objects.options.set({
      iconLayout: "default#image",
      iconImageHref: "./location.svg",
      iconImageSize: [45, 45],
      iconImageOffset: [-20, -50],
      //hideIconOnBalloonOpen: false,
    });

    objectManager.clusters.options.set({
      clusterIconColor: "#E83620",
    });

    objectManager.clusters.events.add("balloonopen", function (e) {
      // Получим id кластера, на котором открылся балун.

      let id = e.get("objectId"),
        // Получим геообъекты внутри кластера.
        cluster = objectManager.clusters.getById(id),
        geoObjects = cluster.properties.geoObjects;

      // Загрузим данные для объектов при необходимости.
      downloadContent(geoObjects, id, true);

      //setNewData();
    });

    function downloadContent(geoObjects, id, isCluster) {
      // Создадим массив меток, для которых данные ещё не загружены.
      let array = geoObjects.filter(function (geoObject) {
          return (
            geoObject.properties.balloonContent === "идет загрузка..." ||
            geoObject.properties.balloonContent === "Not found"
          );
        }),
        // Формируем массив идентификаторов, который будет передан серверу.
        ids = array.map(function (geoObject) {
          return geoObject.id;
        });

      geoObjects.forEach(function (geoObject) {
        // Содержимое балуна берем из данных, полученных от сервера.
        // Сервер возвращает массив объектов вида:
        // [ {"balloonContent": "Содержимое балуна"}, ...]
        console.log(geoObject.properties.balloonContent);
        geoObject.properties.balloonContentBody = `
                           <div class="balloon">
                                <h2 class="balloon__title">${geoObject.properties.balloonContent.title}</h2>
                                <p class="balloon__sub">${geoObject.properties.balloonContent.text}</p>
                           </div>`;
      });
      // Оповещаем балун, что нужно применить новые данные.
      setNewData();

      function setNewData() {
        if (isCluster && objectManager.clusters.balloon.isOpen(id)) {
          objectManager.clusters.balloon.setData(
            objectManager.clusters.balloon.getData()
          );
        } else if (objectManager.objects.balloon.isOpen(id)) {
          objectManager.objects.balloon.setData(
            objectManager.objects.balloon.getData()
          );
        }
      }
    }

    objectManager.add(mapData[0]);

    // Скролл до карты и открытие балуна
    function scrollToMap() {
      const links = document.querySelectorAll("button");
      const map = document.querySelector("#map-contacts");

      links.forEach((link) => {
        link.addEventListener("click", () => {
          map.scrollIntoView({ block: "start", behavior: "smooth" });
          objectManager.objects.balloon.open(link.dataset.balloonId);
        });
      });
    }

    scrollToMap();

    map.controls.remove("geolocationControl"); // удаляем геолокацию
    map.controls.remove("searchControl"); // удаляем поиск
    map.controls.remove("trafficControl"); // удаляем контроль трафика
    map.controls.remove("typeSelector"); // удаляем тип
    map.controls.remove("fullscreenControl"); // удаляем кнопку перехода в полноэкранный режим
    map.controls.remove("zoomControl"); // удаляем контрол зуммирования
    map.controls.remove("rulerControl"); // удаляем контрол правил
    // map.behaviors.disable(['scrollZoom']);

    //map.geoObjects.add(placemark);
  }
  if (!!mapSelector) {
    ymaps.ready(init);
  }
}

mapWhereBuy();