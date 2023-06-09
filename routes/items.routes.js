const express = require('express')
const router = express.Router()
const NostalgicItem = require('../models/NostalgicItem.model.js')
const { isLoggedIn } = require('../middleware/route-guards')
const { uploader } = require('../middleware/cloudinary.config.js')

router.get('/nostalgia-lib', async (req, res, next) => {
  try {
    const allItems = await NostalgicItem.find()
    res.render('contents/nostalgia-lib', { allItems })
  } catch (error) {
    console.log(error)
  }
})

router.get('/create-item', isLoggedIn, (req, res, next) => {
  res.render('contents/create-item')
})

router.post('/create-item', uploader.array('img', 4), async (req, res, next) => {
  try {
    const newItemToDB = {
      name: req.body.name,
      imgUrl: req.files ? (req.files.length !== 0 ? req.files.map(file => file.path) : ['']) : [''],
      shortInfo: req.body.shortInfo,
      longInfo: req.body.longInfo,
      collectedBy: [],
      createdBy: req.session.user._id,
      stories: [],
    }
    const newItem = await NostalgicItem.create(newItemToDB)
    setTimeout(() => {
      res.redirect(`/item/${newItem._id}`)
    }, 1500)
  } catch (error) {
    console.log(error)
  }
})

router.get('/item/:itemId', async (req, res, next) => {
  try {
    const item = await NostalgicItem.findById(req.params.itemId)
      .populate('collectedBy', 'username')
      .populate('createdBy', 'username')
    if (item.stories.length !== 0) {
      await item.populate('stories')
      const promisesGetUsername = []
      item.stories.forEach(story => {
        promisesGetUsername.push(story.populate('createdBy', 'username'))
      })
      await Promise.all(promisesGetUsername)
    }
    res.render('contents/item-page', { item })
  } catch (error) {
    console.log(error)
  }
})

module.exports = router
