const Menu = require('../models/Menu')

exports.getAllItems = async (req, res) => {
    try{
        const allItems = await Menu.find();
        res.status(200).json(allItems)
    }catch(error){
        console.log("error finding all items", error)
        res.status(500).json({message:"error finding all items"}) 
    }
};

exports.getItemByItemId = async (req, res) =>{
    const { itemId } =  req.params;
    try{
        const item = await Menu.findOne({ itemId: itemId })
        if(!item){
            res.status(404).json({message: "item not found"})
            return;
        }
        res.status(200).json(item)
    }catch(error){
        console.log("error getting item by ID", error)
        res.status(500).json({message: "error getting item by ID"})
    }
};

exports.addMenuItem = async (req, res) => {
    try{
        const newItem = new Menu({
            itemId: req.body.itemId,
            name: req.body.name ?? 'default item',
            price: req.body.price ?? 0.00, 
            availability: req.body.availability ?? false,
            category: req.body.category ?? 'Uncategorized',
            priceHistory: [{
                price: req.body.price ?? 0.00, 
                timestamp: new Date()
            }]
        })

        //check if item already exists
        const item = await Menu.findOne({itemId: req.body.itemId})
        if(item){
            return res.status(409).json({message: 'itemId already exists'})
        }
        const savedItem = await newItem.save();
        res.status(201).json({message: "item added successfully", savedItem})
    } catch(error){
        console.log("error adding menu item", error)
        res.status(500).json({message: "error adding menu item"})
    } 
};

exports.deleteItemByItemId = async (req, res) => {
    const { itemId } =  req.params;
    try{
        const deletedItem = await Menu.findOneAndDelete({itemId : itemId})
        if(!deletedItem){
            res.status(404).json({message: "item not found"})
            return;
        }
        res.status(200).json({message: "item deleted successfully"})
    } catch(error){
        console.log("error deleting by ID", error)
        res.status(500).json({message: "error deleting item by ID"})
    } 
};

exports.editItemByItemId = async (req, res) => {
    const itemId = req.params.itemId;
    try{
        const item = await Menu.findOne({itemId : itemId});
        console.log('item:', item);
        if(!item){
            res.status(404).json({message: "item not found"});
            return;
        }
        let newPriceHistory = item.priceHistory;
        if(req.body.price){
            const newPrice = {
                price: req.body.price,
                timestamp: new Date(),
            }
            newPriceHistory.push(newPrice)
        }
        const newAvailability = req.body.available ?? item.available;
        const newCategory = req.body.category ?? item.category;
        const newName = req.body.name ?? item.name
        const newItemId = req.body.itemId ?? item.itemId

        const editedItem = await Menu.findByIdAndUpdate(
            item._id,   
            {
                itemId: newItemId,
                name: newName,
                available: newAvailability, 
                category: newCategory,
                priceHistory: newPriceHistory,

            },{new : true} // return updated document
        );

        res.status(200).json(editedItem);
    } catch(error){
        console.log("error editing by ID", error);
        res.status(500).json({message: "error editing item by ID"});
    } 
};

exports.toggleFavoriteStatus = async (req, res) => { 
    try {
        const menuItem = await Menu.findById(req.params.id); // find it unique id for the item 
        if (menuItem) {
            menuItem.isFavorite = !menuItem.isFavorite;
            const updatedMenuItem = await menuItem.save();
            res.status(200).json(updatedMenuItem);
        } else{
            res.status(404).json({message: 'Menu item not found' });
        }
    } catch (error) {
        console.log("error toggling favorite status", error);
        res.status(500).json({message: "error toggling favorite status "});
    }
};