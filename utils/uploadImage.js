const uploadImageToCloudinary = async (img, model, folder)=>{
    try {
        await cloudinary.uploader
        .upload_stream(
            { folder: folder, width: 150, crop: "scale" },

            async (error, result) => {
            if (error) {
                console.error("Error uploading image:", error);
            } else {
                console.log("Image uploaded successfully:", result);
                model.avatar = {
                public_id: result.public_id,
                url: result.secure_url,
                };

                const resp = await model.save();
                console.log(resp);
            }
            },
        )
        .end(img.data);
      } catch (err) {
        console.log("Error uploading image");
        console.log(err);
      }
}

module.exports = uploadImageToCloudinary;