const express = require('express')
const router = express.Router()
const { isLoggedIn } = require('../middleware/route-guards')
const Story = require('../models/Story.model')
const Profile = require('../models/Profile.model')

const { uploader, destroyer } = require('../middleware/cloudinary.config.js')

router.get('/', isLoggedIn, async (req, res) => {
  //current user's profile and stories
  try {
    const stories = await Story.find({ createdBy: req.session.user._id })
      .sort({ createdAt: -1 })
      .populate('itemId')

    let profile = await Profile.findOne({ createdBy: req.session.user._id })
    if (!profile) {
      profile = await Profile.create({ createdBy: req.session.user._id })
    }
    res.render('profile', {
      stories,
      profile,
      username: req.session.user.username,
      isMyProfile: true,
    })
  } catch (error) {
    console.log('error in the displaying my profile route GET', error)
  }
})

router.get('/edit', isLoggedIn, async (req, res) => {
  try {
    const profile = await Profile.findOne({ createdBy: req.session.user._id })
    res.render('edit-profile', { profile })
  } catch (error) {
    console.log('error in the profile editing route GET', error)
  }
})

router.get('/:userId', async (req, res) => {
  //any user's profile and stories
  try {
    const stories = await Story.find({ createdBy: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('itemId')
    const profile = await Profile.findOne({ createdBy: req.params.userId }).populate(
      'createdBy',
      'username'
    )
    res.render('profile', {
      stories,
      profile,
      username: profile.createdBy.username,
      isMyProfile: false,
    })
  } catch (error) {
    console.log('error in the displaying any profile route GET', error)
  }
})

router.post('/edit', uploader.single('pic'), async (req, res) => {
  try {
    const currProfile = await Profile.findOne({ createdBy: req.session.user._id })
    if (!!currProfile.oldPicFilename && !!req.file) {
      await destroyer(currProfile.oldPicFilename)
    }
    await Profile.findOneAndUpdate(
      { createdBy: req.session.user._id },
      {
        picUrl: req.file ? req.file.path : currProfile.picUrl,
        oldPicFilename: req.file ? req.file.filename : currProfile.oldPicFilename,
        birth: req.body.birth,
        intro: req.body.intro,
      }
    )
    res.redirect('/profile')
  } catch (error) {
    console.log('error in the profile editing route POST', error)
  }
})

module.exports = router
