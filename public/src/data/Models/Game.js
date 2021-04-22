class Game{
    constructor(uid, name, developer, description, image){
        this.uid = uid
        this.name = name;
        this.developer = developer;
        this.description = description;
        this.image = image;
        this.stores = {
            steam:{
                listed:false,
                onSale:false,
                price:0,
                sale:0
            },
            xbox:{
                listed:false,
                onSale:false,
                price:0,
                sale:0
            },
            playstation:{
                listed:false,
                onSale:false,
                price:0,
                sale:0
            },
            nintendo:{
                listed:false,
                onSale:false,
                price:0,
                sale:0
            },
            itch:{
                listed:false,
                onSale:false,
                price:0,
                sale:0
            }
          }
        
        }
    }

exports.Game = Game