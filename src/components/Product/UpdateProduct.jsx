"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Upload, X, Trash2, Edit, Play } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { useParams } from "react-router-dom"
// import * as apis from "../../service"
import { MyEditor } from "../index"

// Helper function to extract video ID and get embed URL
const getVideoEmbedUrl = (url) => {
  if (!url) return null

  // YouTube patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  // Vimeo patterns
  const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  // Direct video file URLs
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url
  }

  return null
}

const VideoPreview = ({ url, className = "" }) => {
  const embedUrl = getVideoEmbedUrl(url)

  if (!embedUrl) return null

  // For direct video files
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <div className={`relative ${className}`}>
        <video controls className="w-full h-48 object-cover rounded" preload="metadata">
          <source src={embedUrl} type="video/mp4" />
          Trình duyệt không hỗ trợ video.
        </video>
      </div>
    )
  }

  // For YouTube/Vimeo embeds
  return (
    <div className={`relative ${className}`}>
      <iframe
        src={embedUrl}
        className="w-full h-48 rounded"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video preview"
      />
    </div>
  )
}

const SpecificationGroup = ({
  index,
  control,
  register,
  errors,
  isLoading,
  removeSpecification,
  specificationsFields,
}) => {
  const {
    fields: items,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `product.specifications[${index}].items`,
  })

  return (
    <div className="mb-4 border p-4 rounded-sm">
      <div className="flex justify-between items-center mb-2">
        <span>Nhóm thông số {index + 1}</span>
        {specificationsFields.length > 1 && (
          <button
            type="button"
            onClick={() => removeSpecification(index)}
            className="text-red-500 hover:text-red-600 cursor-pointer"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">Nhóm</label>
        <input
          {...register(`product.specifications[${index}].group`, { required: "Nhóm là bắt buộc" })}
          placeholder="Tên nhóm"
          className={`w-full px-3 py-2 border rounded-sm ${errors.product?.specifications?.[index]?.group ? "border-red-500" : "border-gray-300"}`}
          disabled={isLoading}
        />
        {errors.product?.specifications?.[index]?.group && (
          <p className="text-red-500 text-sm mt-1">{errors.product.specifications[index].group.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Mục thông số</label>
        {items.map((item, itemIndex) => (
          <div key={item.id} className="flex space-x-2 mb-2">
            <div className="w-1/2">
              <input
                {...register(`product.specifications[${index}].items[${itemIndex}].label`, {
                  required: "Nhãn là bắt buộc",
                })}
                placeholder="Nhãn"
                className={`w-full px-3 py-2 border rounded-sm ${errors.product?.specifications?.[index]?.items?.[itemIndex]?.label ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {errors.product?.specifications?.[index]?.items?.[itemIndex]?.label && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.product.specifications[index].items[itemIndex].label.message}
                </p>
              )}
            </div>
            <div className="w-1/2">
              <input
                {...register(`product.specifications[${index}].items[${itemIndex}].value`, {
                  required: "Giá trị là bắt buộc",
                })}
                placeholder="Giá trị"
                className={`w-full px-3 py-2 border rounded-sm ${errors.product?.specifications?.[index]?.items?.[itemIndex]?.value ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {errors.product?.specifications?.[index]?.items?.[itemIndex]?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.product.specifications[index].items[itemIndex].value.message}
                </p>
              )}
            </div>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(itemIndex)}
                className="text-red-500 hover:text-red-600 mt-2 cursor-pointer"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => appendItem({ label: "", value: "" })}
          className="text-blue-500 hover:text-blue-600 flex items-center cursor-pointer"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm mục
        </button>
      </div>
    </div>
  )
}

const ProductItem = ({
  itemIndex,
  control,
  register,
  errors,
  isLoading,
  removeProductItem,
  productItemsPreviews,
  setProductItemsPreviews,
  handleProductItemThumbChange,
  handleProductItemImageChange,
  setValue,
  clearErrors,
  productItemsFields,
  suppliers,
  branches,
  setProductItemImagesDelete,
}) => {
  const {
    fields: attributes,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({
    control,
    name: `productItems[${itemIndex}].attributes`,
  })

  useEffect(() => {
    if (attributes.length === 0) {
      appendAttribute({ code: "", value: "" })
    }
  }, [attributes.length, appendAttribute])

  const handleRemoveExistingImage = (imageIndex, imageFileName, itemId) => {
    // Xóa hình ảnh khỏi preview
    setProductItemsPreviews((prev) => {
      const newPreviews = [...prev]
      newPreviews[itemIndex].images = newPreviews[itemIndex].images.filter((_, i) => i !== imageIndex)
      return newPreviews
    })

    // Thêm vào danh sách xóa
    setProductItemImagesDelete((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), imageFileName],
    }))

    // Cập nhật form values
    const currentImages = control._formValues.productItems[itemIndex].images || []
    const newImages = currentImages.filter((_, i) => i !== imageIndex)
    setValue(`productItems[${itemIndex}].images`, newImages)
  }

  return (
    <div className="mb-6 border p-6 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-md font-medium">Mục sản phẩm {itemIndex + 1}</span>
        {productItemsFields.length > 1 && (
          <button
            type="button"
            onClick={() => {
              removeProductItem(itemIndex)
              setProductItemsPreviews((prev) => prev.filter((_, i) => i !== itemIndex))
            }}
            className="text-red-500 hover:text-red-600 cursor-pointer"
            disabled={isLoading}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-md font-medium mb-4">Thông tin mục sản phẩm</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register(`productItems[${itemIndex}].name`, { required: "Tên mục là bắt buộc" })}
                placeholder="Tên mục sản phẩm"
                className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.name ? "border-red-600" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {errors.productItems?.[itemIndex]?.name && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register(`productItems[${itemIndex}].barcode`, { required: "Barcode là bắt buộc" })}
                placeholder="Barcode"
                className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.barcode ? "border-red-600" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {errors.productItems?.[itemIndex]?.barcode && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].barcode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                {...register(`productItems[${itemIndex}].status`)}
                className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.status ? "border-red-600" : "border-gray-300"}`}
                disabled={isLoading}
              >
                <option value="">Chọn trạng thái</option>
                <option value="inactive">Không hoạt động</option>
                <option value="active">Hoạt động</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
              {errors.productItems?.[itemIndex]?.status && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].status.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh chính <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-sm p-6 text-center ${errors.productItems?.[itemIndex]?.thumb ? "border-red-600" : "border-gray-300"}`}
              >
                {productItemsPreviews[itemIndex]?.thumb ? (
                  <div className="relative">
                    <img
                      src={productItemsPreviews[itemIndex].thumb || "/placeholder.svg"}
                      alt="Thumbnail"
                      className="mx-auto max-w-full max-h-48 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProductItemsPreviews((prev) => {
                          const newPreviews = [...prev]
                          newPreviews[itemIndex] = { ...newPreviews[itemIndex], thumb: "" }
                          return newPreviews
                        })
                        setValue(`productItems[${itemIndex}].thumb`, null)
                        setValue(`productItems[${itemIndex}].thumbUrl`, "")
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <label htmlFor={`item-thumb-${itemIndex}`} className="cursor-pointer">
                      <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                        Chọn ảnh
                      </span>
                      <input
                        id={`item-thumb-${itemIndex}`}
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        onChange={(e) => handleProductItemThumbChange(itemIndex, e)}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                    <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB</div>
                  </div>
                )}
              </div>
              {errors.productItems?.[itemIndex]?.thumb && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].thumb.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh bổ sung <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-sm p-6 text-center ${errors.productItems?.[itemIndex]?.images ? "border-red-600" : "border-gray-300"}`}
              >
                <div className="mb-4">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <label htmlFor={`item-images-${itemIndex}`} className="cursor-pointer">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                      Chọn nhiều ảnh
                    </span>
                    <input
                      id={`item-images-${itemIndex}`}
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      multiple
                      onChange={(e) => handleProductItemImageChange(itemIndex, e)}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                  <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB mỗi ảnh</div>
                </div>
                {productItemsPreviews[itemIndex]?.images?.some((img) => img) && (
                  <div className="grid grid-cols-2 gap-4">
                    {productItemsPreviews[itemIndex].images.map(
                      (img, imageIndex) =>
                        img && (
                          <div key={imageIndex} className="relative">
                            <img
                              src={img || "/placeholder.svg"}
                              alt={`Image ${imageIndex}`}
                              className="mx-auto max-w-full max-h-48 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentItem = control._formValues.productItems[itemIndex]
                                const currentImage = currentItem.images[imageIndex]

                                if (currentImage && currentImage.imageFileName && currentItem._id) {
                                  // Hình ảnh hiện tại từ server
                                  handleRemoveExistingImage(imageIndex, currentImage.imageFileName, currentItem._id)
                                } else {
                                  // Hình ảnh mới được thêm
                                  setProductItemsPreviews((prev) => {
                                    const newPreviews = [...prev]
                                    newPreviews[itemIndex].images = newPreviews[itemIndex].images.filter(
                                      (_, i) => i !== imageIndex,
                                    )
                                    return newPreviews
                                  })
                                  const newImages = control._formValues.productItems[itemIndex].images.filter(
                                    (_, i) => i !== imageIndex,
                                  )
                                  setValue(`productItems[${itemIndex}].images`, newImages)
                                }
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ),
                    )}
                  </div>
                )}
              </div>
              {errors.productItems?.[itemIndex]?.images && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].images.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thuộc tính <span className="text-red-500">*</span>
          </label>
          {attributes.map((attr, attrIndex) => (
            <div key={attr.id} className="mb-4 border p-4 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <span>Thuộc tính {attrIndex + 1}</span>
                {attributes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttribute(attrIndex)}
                    className="text-red-500 hover:text-red-600 cursor-pointer"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <input
                    type="text"
                    {...register(`productItems[${itemIndex}].attributes[${attrIndex}].code`, {
                      required: "Mã là bắt buộc",
                    })}
                    placeholder="Mã thuộc tính"
                    className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.attributes?.[attrIndex]?.code ? "border-red-600" : "border-gray-300"}`}
                    disabled={isLoading}
                  />
                  {errors.productItems?.[itemIndex]?.attributes?.[attrIndex]?.code && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.productItems[itemIndex].attributes[attrIndex].code.message}
                    </p>
                  )}
                </div>
                <div className="w-1/2">
                  <input
                    type="text"
                    {...register(`productItems[${itemIndex}].attributes[${attrIndex}].value`, {
                      required: "Giá trị là bắt buộc",
                    })}
                    placeholder="Giá trị thuộc tính"
                    className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.attributes?.[attrIndex]?.value ? "border-red-600" : "border-gray-300"}`}
                    disabled={isLoading}
                  />
                  {errors.productItems?.[itemIndex]?.attributes?.[attrIndex]?.value && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.productItems[itemIndex].attributes[attrIndex].value.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {errors.productItems?.[itemIndex]?.attributes && (
            <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].attributes.message}</p>
          )}
          <button
            type="button"
            onClick={() => appendAttribute({ code: "", value: "" })}
            className="text-blue-500 hover:text-blue-600 flex items-center cursor-pointer"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm thuộc tính
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-md font-medium mb-4">Thông tin kho hàng</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá bán lẻ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register(`productItems[${itemIndex}].retailPrice`, {
                  required: "Giá bán lẻ là bắt buộc",
                  pattern: {
                    value: /^\d*\.?\d*$/,
                    message: "Giá bán lẻ phải là số không âm",
                  },
                  validate: (value) => {
                    const num = Number.parseFloat(value)
                    return (!isNaN(num) && num >= 0) || "Giá bán lẻ phải là số không âm"
                  },
                })}
                placeholder="Giá bán lẻ"
                className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.retailPrice ? "border-red-600" : "border-gray-300"}`}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
                    e.preventDefault()
                  }
                }}
                onChange={(e) => {
                  let value = e.target.value
                  value = value.replace(/[^0-9.]/g, "")
                  const parts = value.split(".")
                  if (parts.length > 2) {
                    value = parts[0] + "." + parts.slice(1).join("")
                  }
                  setValue(`productItems[${itemIndex}].retailPrice`, value, { shouldValidate: true })
                  if (value && !isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0) {
                    clearErrors(`productItems[${itemIndex}].retailPrice`)
                  }
                }}
              />
              {errors.productItems?.[itemIndex]?.retailPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].retailPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register(`productItems[${itemIndex}].wholesalePrice`, {
                  required: "Giá nhập là bắt buộc",
                  pattern: {
                    value: /^\d*\.?\d*$/,
                    message: "Giá nhập phải là số không âm",
                  },
                  validate: (value) => {
                    const num = Number.parseFloat(value)
                    return (!isNaN(num) && num >= 0) || "Giá nhập phải là số không âm"
                  },
                })}
                placeholder="Giá nhập"
                className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.wholesalePrice ? "border-red-600" : "border-gray-300"}`}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
                    e.preventDefault()
                  }
                }}
                onChange={(e) => {
                  let value = e.target.value
                  value = value.replace(/[^0-9.]/g, "")
                  const parts = value.split(".")
                  if (parts.length > 2) {
                    value = parts[0] + "." + parts.slice(1).join("")
                  }
                  setValue(`productItems[${itemIndex}].wholesalePrice`, value, { shouldValidate: true })
                  if (value && !isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0) {
                    clearErrors(`productItems[${itemIndex}].wholesalePrice`)
                  }
                }}
              />
              {errors.productItems?.[itemIndex]?.wholesalePrice && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].wholesalePrice.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <select
                {...register(`productItems[${itemIndex}].supplier`, { required: "Nhà cung cấp là bắt buộc" })}
                className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.supplier ? "border-red-600" : "border-gray-300"}`}
                disabled={isLoading}
              >
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.productItems?.[itemIndex]?.supplier && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].supplier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi nhánh <span className="text-red-500">*</span>
              </label>
              <select
                {...register(`productItems[${itemIndex}].branch`, { required: "Chi nhánh là bắt buộc" })}
                className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.productItems?.[itemIndex]?.branch ? "border-red-600" : "border-gray-300"}`}
                disabled={isLoading}
              >
                <option value="">Chọn chi nhánh</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.productItems?.[itemIndex]?.branch && (
                <p className="text-red-500 text-sm mt-1">{errors.productItems[itemIndex].branch.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const UpdateProduct = () => {
  const params = useParams()
  const productId = params?.productId

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    control,
    reset,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      product: {
        name: "",
        description: "",
        videoUrl: "",
        thumb: null,
        thumbUrl: "",
        thumbFileName: "",
        featuredImages: [],
        specifications: [{ group: "", items: [{ label: "", value: "" }] }],
        brandId: "",
        categoryId: "",
        isActive: false,
        shortDescription: "",
      },
      productItems: [],
    },
  })

  // Watch video URL for preview
  const videoUrl = watch("product.videoUrl")

  const {
    fields: specificationsFields,
    append: appendSpecification,
    remove: removeSpecification,
  } = useFieldArray({
    control,
    name: "product.specifications",
  })

  const {
    fields: productItemsFields,
    append: appendProductItem,
    remove: removeProductItem,
  } = useFieldArray({
    control,
    name: "productItems",
  })

  const [thumbPreview, setThumbPreview] = useState("")
  const [featuredImagesPreviews, setFeaturedImagesPreviews] = useState([])
  const [productItemsPreviews, setProductItemsPreviews] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [branches, setBranches] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // State để track các hình ảnh cần xóa
  const [featuredImagesDelete, setFeaturedImagesDelete] = useState([])
  const [productItemImagesDelete, setProductItemImagesDelete] = useState({})

  // Load dữ liệu sản phẩm hiện tại
  // useEffect(() => {
  //   const fetchProductData = async () => {
  //     if (!productId) return

  //     try {
  //       setIsLoadingData(true)

  //       // Load cả product data và options cùng lúc
  //       const [productResponse, brandRes, categoryRes, supplierRes, branchRes] = await Promise.all([
  //         apis.apiGetProduct(productId),
  //         apis.apiGetAllBrands(),
  //         apis.apiGetAllCategories(),
  //         apis.apiGetAllSuppliers(),
  //         apis.apiGetAllBranches(),
  //       ])

  //       const productData = productResponse.data

  //       // Set options trước
  //       setBrands(brandRes?.brands?.filter((b) => b.isActive) || [])
  //       setCategories(categoryRes?.categories?.filter((c) => c.isActive) || [])
  //       setSuppliers(supplierRes?.suppliers?.filter((s) => s.isActive) || [])
  //       setBranches(branchRes?.branches?.filter((b) => b.isActive) || [])
  //       setLoadingOptions(false)

  //       // Reset form với dữ liệu hiện tại
  //       const formData = {
  //         product: {
  //           name: productData.name || "",
  //           description: productData.description || "",
  //           videoUrl: productData.videoUrl || "",
  //           thumb: null,
  //           thumbUrl: productData.thumbUrl || "",
  //           thumbFileName: productData.thumbFileName || "",
  //           featuredImages: productData.featuredImages || [],
  //           specifications:
  //             productData.specifications?.length > 0
  //               ? productData.specifications
  //               : [{ group: "", items: [{ label: "", value: "" }] }],
  //           brandId: productData.brandId || "",
  //           categoryId: productData.categoryId || "",
  //           isActive: productData.isActive || false,
  //           shortDescription: productData.shortDescription || "",
  //         },
  //         productItems:
  //           productData.productItems?.map((item) => ({
  //             _id: item._id,
  //             name: item.name || "",
  //             barcode: item.barcode || "",
  //             thumb: null,
  //             thumbUrl: item.thumbUrl || "",
  //             thumbFileName: item.thumbFileName || "",
  //             images: item.images || [],
  //             attributes: item.attributes?.length > 0 ? item.attributes : [{ code: "", value: "" }],
  //             status: item.status || "inactive",
  //             retailPrice: item.retailPrice?.toString() || "",
  //             wholesalePrice: item.wholesalePrice?.toString() || "",
  //             supplier: item.inventory?.[0]?.supplierId || "",
  //             branch: item.inventory?.[0]?.branchId || "",
  //           })) || [],
  //       }

  //       reset(formData)

  //       // Set previews cho hình ảnh hiện tại
  //       setThumbPreview(productData.thumbUrl || "")
  //       setFeaturedImagesPreviews(productData.featuredImages?.map((img) => img.image) || [])

  //       const itemPreviews =
  //         productData.productItems?.map((item) => ({
  //           thumb: item.thumbUrl || "",
  //           images: item.images?.map((img) => img.image) || [],
  //         })) || []
  //       setProductItemsPreviews(itemPreviews)
  //     } catch (error) {
  //       console.error("Error fetching product data:", error)
  //       setError("form", { message: "Không thể tải dữ liệu sản phẩm" })
  //     } finally {
  //       setIsLoadingData(false)
  //     }
  //   }

  //   fetchProductData()
  // }, [productId, reset, setError])

  useEffect(() => {
    if (errors.form) {
      clearErrors("form")
    }
  }, [control._formValues, clearErrors, errors.form])

  const handleThumbChange = (e) => {
    clearErrors("product.thumb")
    const file = e.target.files[0]
    if (file) {
      const validTypes = ["image/png", "image/jpeg", "image/gif"]
      if (!validTypes.includes(file.type)) {
        setError("product.thumb", { message: "Chỉ chấp nhận PNG, JPG, GIF" })
        setThumbPreview("")
        setValue("product.thumb", null)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("product.thumb", { message: "Hình ảnh không vượt quá 10MB" })
        setThumbPreview("")
        setValue("product.thumb", null)
        return
      }
      setValue("product.thumb", file)
      setValue("product.thumbFileName", file.name)
      const reader = new FileReader()
      reader.onload = (e) => setThumbPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setThumbPreview("")
      setValue("product.thumb", null)
    }
  }

  const handleFeaturedImageChange = (e) => {
    clearErrors("product.featuredImages")
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const validTypes = ["image/png", "image/jpeg", "image/gif"]
      const invalidFiles = files.filter((file) => !validTypes.includes(file.type) || file.size > 10 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError("product.featuredImages", {
          message: "Một số hình ảnh không hợp lệ (chỉ chấp nhận PNG, JPG, GIF, tối đa 10MB)",
        })
        return
      }
      const newImages = files.map((file) => ({ image: file, imageFileName: file.name }))
      const currentImages = control._formValues.product.featuredImages || []
      setValue("product.featuredImages", [...currentImages, ...newImages])
      const previews = files.map((file) => {
        const reader = new FileReader()
        return new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(file)
        })
      })
      Promise.all(previews).then((results) => {
        setFeaturedImagesPreviews((prev) => [...prev, ...results])
      })
    }
  }

  const handleRemoveFeaturedImage = (index) => {
    const currentImages = control._formValues.product.featuredImages || []
    const imageToRemove = currentImages[index]

    if (imageToRemove && imageToRemove.imageFileName && typeof imageToRemove.image === "string") {
      // Hình ảnh hiện tại từ server
      setFeaturedImagesDelete((prev) => [...prev, imageToRemove.imageFileName])
    }

    // Xóa khỏi preview và form
    setFeaturedImagesPreviews((prev) => prev.filter((_, i) => i !== index))
    const newImages = currentImages.filter((_, i) => i !== index)
    setValue("product.featuredImages", newImages)
  }

  const handleProductItemThumbChange = (itemIndex, e) => {
    clearErrors(`productItems[${itemIndex}].thumb`)
    clearErrors("productItems")
    const file = e.target.files[0]
    if (file) {
      const validTypes = ["image/png", "image/jpeg", "image/gif"]
      if (!validTypes.includes(file.type)) {
        setError(`productItems[${itemIndex}].thumb`, { message: "Chỉ chấp nhận PNG, JPG, GIF" })
        setProductItemsPreviews((prev) => {
          const newPreviews = [...prev]
          newPreviews[itemIndex] = { ...newPreviews[itemIndex], thumb: "" }
          return newPreviews
        })
        setValue(`productItems[${itemIndex}].thumb`, null)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`productItems[${itemIndex}].thumb`, { message: "Hình ảnh không vượt quá 10MB" })
        setProductItemsPreviews((prev) => {
          const newPreviews = [...prev]
          newPreviews[itemIndex] = { ...newPreviews[itemIndex], thumb: "" }
          return newPreviews
        })
        setValue(`productItems[${itemIndex}].thumb`, null)
        return
      }
      setValue(`productItems[${itemIndex}].thumb`, file)
      setValue(`productItems[${itemIndex}].thumbFileName`, file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProductItemsPreviews((prev) => {
          const newPreviews = [...prev]
          newPreviews[itemIndex] = { ...newPreviews[itemIndex], thumb: e.target.result }
          return newPreviews
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProductItemImageChange = (itemIndex, e) => {
    clearErrors(`productItems[${itemIndex}].images`)
    clearErrors("productItems")
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const validTypes = ["image/png", "image/jpeg", "image/gif"]
      const invalidFiles = files.filter((file) => !validTypes.includes(file.type) || file.size > 10 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError(`productItems[${itemIndex}].images`, {
          message: "Một số hình ảnh không hợp lệ (chỉ chấp nhận PNG, JPG, GIF, tối đa 10MB)",
        })
        return
      }
      const newImages = files.map((file) => ({ image: file, imageFileName: file.name }))
      const currentImages = control._formValues.productItems[itemIndex].images || []
      setValue(`productItems[${itemIndex}].images`, [...currentImages, ...newImages])
      const previews = files.map((file) => {
        const reader = new FileReader()
        return new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(file)
        })
      })
      Promise.all(previews).then((results) => {
        setProductItemsPreviews((prev) => {
          const newPreviews = [...prev]
          newPreviews[itemIndex] = {
            ...newPreviews[itemIndex],
            images: [...(newPreviews[itemIndex].images || []), ...results],
          }
          return newPreviews
        })
      })
    }
  }

  // const onSubmit = async (data) => {
  //   // Validation logic tương tự như CreateProduct
  //   if (!data.product.name) {
  //     setError("product.name", { message: "Tên sản phẩm là bắt buộc" })
  //     return
  //   }
  //   if (!data.product.description) {
  //     setError("product.description", { message: "Mô tả là bắt buộc" })
  //     return
  //   }
  //   if (!data.product.thumbUrl && !data.product.thumb) {
  //     setError("product.thumb", { message: "Hình ảnh sản phẩm là bắt buộc" })
  //     return
  //   }
  //   if (!data.product.brandId) {
  //     setError("product.brandId", { message: "Thương hiệu là bắt buộc" })
  //     return
  //   }
  //   if (!data.product.categoryId) {
  //     setError("product.categoryId", { message: "Danh mục là bắt buộc" })
  //     return
  //   }

  //   // Validation cho featured images
  //   const hasExistingFeaturedImages = data.product.featuredImages.some(
  //     (img) => typeof img.image === "string" && !featuredImagesDelete.includes(img.imageFileName),
  //   )
  //   const hasNewFeaturedImages = data.product.featuredImages.some((img) => typeof img.image === "object")

  //   if (!hasExistingFeaturedImages && !hasNewFeaturedImages) {
  //     setError("product.featuredImages", { message: "Ít nhất một hình ảnh nổi bật là bắt buộc" })
  //     return
  //   }

  //   // Validation cho product items
  //   if (data.productItems.length === 0) {
  //     setError("productItems", { message: "Ít nhất một mục sản phẩm là bắt buộc" })
  //     return
  //   }

  //   // Validation chi tiết cho từng product item
  //   for (let i = 0; i < data.productItems.length; i++) {
  //     const item = data.productItems[i]

  //     if (!item.name) {
  //       setError(`productItems[${i}].name`, { message: "Tên mục sản phẩm là bắt buộc" })
  //       return
  //     }
  //     if (!item.barcode) {
  //       setError(`productItems[${i}].barcode`, { message: "Barcode là bắt buộc" })
  //       return
  //     }
  //     if (!item.thumbUrl && !item.thumb) {
  //       setError(`productItems[${i}].thumb`, { message: "Hình ảnh mục sản phẩm là bắt buộc" })
  //       return
  //     }

  //     // Validation cho images của product item
  //     const hasExistingImages = item.images.some(
  //       (img) =>
  //         typeof img.image === "string" &&
  //         (!productItemImagesDelete[item._id] || !productItemImagesDelete[item._id].includes(img.imageFileName)),
  //     )
  //     const hasNewImages = item.images.some((img) => typeof img.image === "object")

  //     if (!hasExistingImages && !hasNewImages) {
  //       setError(`productItems[${i}].images`, { message: "Ít nhất một hình ảnh bổ sung là bắt buộc" })
  //       return
  //     }

  //     // Validation cho attributes
  //     if (item.attributes.length === 0) {
  //       setError(`productItems[${i}].attributes`, { message: "Ít nhất một thuộc tính là bắt buộc" })
  //       return
  //     }

  //     for (let j = 0; j < item.attributes.length; j++) {
  //       if (!item.attributes[j].code) {
  //         setError(`productItems[${i}].attributes[${j}].code`, { message: "Mã thuộc tính là bắt buộc" })
  //         return
  //       }
  //       if (!item.attributes[j].value) {
  //         setError(`productItems[${i}].attributes[${j}].value`, { message: "Giá trị thuộc tính là bắt buộc" })
  //         return
  //       }
  //     }

  //     // Validation cho giá
  //     if (!item.retailPrice || isNaN(Number.parseFloat(item.retailPrice)) || Number.parseFloat(item.retailPrice) < 0) {
  //       setError(`productItems[${i}].retailPrice`, { message: "Giá bán lẻ phải là số không âm" })
  //       return
  //     }
  //     if (
  //       !item.wholesalePrice ||
  //       isNaN(Number.parseFloat(item.wholesalePrice)) ||
  //       Number.parseFloat(item.wholesalePrice) < 0
  //     ) {
  //       setError(`productItems[${i}].wholesalePrice`, { message: "Giá nhập phải là số không âm" })
  //       return
  //     }
  //     if (!item.supplier) {
  //       setError(`productItems[${i}].supplier`, { message: "Nhà cung cấp là bắt buộc" })
  //       return
  //     }
  //     if (!item.branch) {
  //       setError(`productItems[${i}].branch`, { message: "Chi nhánh là bắt buộc" })
  //       return
  //     }
  //   }

  //   try {
  //     setIsLoading(true)

  //     // Loại bỏ _id từ specifications items
  //     const cleanedSpecifications = data.product.specifications.map((spec) => ({
  //       group: spec.group,
  //       items: spec.items.map((item) => ({
  //         label: item.label,
  //         value: item.value,
  //       })),
  //     }))

  //     // Add product data
  //     const productData = {
  //       name: data.product.name,
  //       shortDescription: data.product.shortDescription,
  //       description: data.product.description,
  //       videoUrl: data.product.videoUrl || "",
  //       specifications: cleanedSpecifications,
  //       brandId: data.product.brandId,
  //       categoryId: data.product.categoryId,
  //       isActive: data.product.isActive,
  //     }

  //     // Tạo FormData
  //     const formData = new FormData()

  //     // Add product data

  //     formData.append("product", JSON.stringify(productData))

  //     // Add product items data
  //     const productItemsData = data.productItems.map((item) => ({
  //       _id: item._id || undefined,
  //       name: item.name.trim(),
  //       barcode: item.barcode.trim(),
  //       attributes: item.attributes.map((attr) => ({
  //         code: attr.code.trim(),
  //         value: attr.value.trim(),
  //       })),
  //       status: item.status || "inactive",
  //       retailPrice: Number.parseFloat(item.retailPrice),
  //       wholesalePrice: Number.parseFloat(item.wholesalePrice),
  //       supplier: item.supplier,
  //       branch: item.branch,
  //       initialStock: 0, // Thêm initialStock mặc định
  //     }))

  //     formData.append("productItems", JSON.stringify(productItemsData))

  //     // Add product thumbnail nếu có file mới
  //     if (data.product.thumb) {
  //       formData.append("thumbProduct", data.product.thumb)
  //     }

  //     // Add featured images mới
  //     const newFeaturedImages = data.product.featuredImages.filter((img) => typeof img.image === "object")
  //     newFeaturedImages.forEach((img) => {
  //       formData.append("featuredImages", img.image)
  //     })

  //     // Add product item thumbnails
  //     data.productItems.forEach((item, index) => {
  //       if (item.thumb) {
  //         formData.append(`thumbProductItem[${index}]`, item.thumb)
  //       }
  //     })

  //     // Add product item images mới
  //     data.productItems.forEach((item, itemIndex) => {
  //       const newImages = item.images.filter((img) => typeof img.image === "object")
  //       newImages.forEach((img) => {
  //         formData.append(`productItemImages[${itemIndex}]`, img.image)
  //       })
  //     })

  //     // Luôn truyền featuredImagesDelete vào formData dưới dạng mảng
  //     formData.append("featuredImagesDelete", JSON.stringify(featuredImagesDelete || []))

  //     // Chuyển đổi productItemImagesDelete từ object sang mảng các string (tên file)
  //     const productItemImagesDeleteArray = []
  //     if (productItemImagesDelete && Object.keys(productItemImagesDelete).length > 0) {
  //       for (const itemId in productItemImagesDelete) {
  //         if (productItemImagesDelete[itemId] && productItemImagesDelete[itemId].length > 0) {
  //           // Chỉ lấy tên file, không cần itemId
  //           productItemImagesDeleteArray.push(...productItemImagesDelete[itemId])
  //         }
  //       }
  //     }
  //     formData.append("productItemImagesDelete", JSON.stringify(productItemImagesDeleteArray))

  //     // Gửi request cập nhật
  //     const response = await apis.apiUpdateProduct(productId, formData)
  //     console.log("Response:", response)
  //     window.history.back()
  //   } catch (error) {
  //     console.error("Error updating product:", error)
  //     if (error.response?.data?.error?.includes("duplicate key")) {
  //       if (error.response.data.error.includes("name")) {
  //         setError("product.name", { message: "Tên sản phẩm đã tồn tại" })
  //       } else {
  //         data.productItems.forEach((item, index) => {
  //           if (error.response.data.error.includes("name")) {
  //             setError(`productItems[${index}].name`, { message: "Tên mục sản phẩm đã tồn tại" })
  //           } else if (error.response.data.error.includes("barcode")) {
  //             setError(`productItems[${index}].barcode`, { message: "Barcode đã tồn tại" })
  //           }
  //         })
  //       }
  //     } else {
  //       setError("form", { message: "Có lỗi khi cập nhật sản phẩm. Vui lòng thử lại." })
  //     }
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  if (isLoadingData) {
    return (
      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-sm hover:bg-gray-300 flex items-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          QUẢN LÝ SẢN PHẨM
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-md">
        <div className="bg-[#00D5BE] text-white p-4 rounded-t-sm">
          <h2 className="text-lg font-semibold">CẬP NHẬT SẢN PHẨM</h2>
        </div>

        <div className="p-6">
          <form 
          // onSubmit={handleSubmit(onSubmit)}
          >
            <h3 className="text-lg font-medium mb-4">Thông tin sản phẩm</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("product.name", { required: "Tên sản phẩm là bắt buộc" })}
                    placeholder="Tên sản phẩm"
                    className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.product?.name ? "border-red-600" : "border-gray-300"}`}
                    disabled={isLoading}
                  />
                  {errors.product?.name && <p className="text-red-500 text-sm mt-1">{errors.product.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả ngắn <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("product.shortDescription", { required: "Mô tả ngắn là bắt buộc" })}
                    placeholder="Mô tả ngắn về sản phẩm"
                    className={`w-full px-3 py-2 border rounded-sm ${errors.product?.shortDescription ? "border-red-600" : "border-gray-300"}`}
                    disabled={isLoading}
                  />
                  {errors.product?.shortDescription && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.shortDescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <MyEditor
                    value={control._formValues.product.description}
                    onChange={(data) => {
                      setValue("product.description", data, { shouldValidate: true })
                      if (data && data.trim()) {
                        clearErrors("product.description")
                      }
                    }}
                    disabled={isLoading}
                    error={errors.product?.description}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Video</label>
                  <input
                    type="text"
                    {...register("product.videoUrl", {
                      pattern: {
                        value:
                          /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/|vimeo\.com\/|.*\.(mp4|webm|ogg)).*$/i,
                        message: "URL Video không hợp lệ (hỗ trợ YouTube, Vimeo, hoặc file video trực tiếp)",
                      },
                    })}
                    placeholder="https://youtube.com/watch?v=... hoặc https://vimeo.com/..."
                    className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.product?.videoUrl ? "border-red-600" : "border-gray-300"}`}
                    disabled={isLoading}
                  />
                  {errors.product?.videoUrl && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.videoUrl.message}</p>
                  )}

                  {/* Video Preview */}
                  {videoUrl && !errors.product?.videoUrl && (
                    <div className="mt-3">
                      <div className="flex items-center mb-2">
                        <Play className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Xem trước video:</span>
                      </div>
                      <VideoPreview url={videoUrl} className="border rounded-sm overflow-hidden" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("product.brandId", { required: "Thương hiệu là bắt buộc" })}
                    className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.product?.brandId ? "border-red-600" : "border-gray-300"}`}
                    disabled={isLoading || loadingOptions}
                  >
                    <option value="">{loadingOptions ? "Đang tải..." : "Chọn thương hiệu"}</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  {errors.product?.brandId && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.brandId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("product.categoryId", { required: "Danh mục là bắt buộc" })}
                    className={`w-full px-3 py-1 text-sm border rounded-sm ${errors.product?.categoryId ? "border-red-600" : "border-gray-300"}`}
                    disabled={isLoading || loadingOptions}
                  >
                    <option value="">{loadingOptions ? "Đang tải..." : "Chọn danh mục"}</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.product?.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.categoryId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register("product.isActive")}
                      className="h-4 w-4 text-blue-600 cursor-pointer"
                      disabled={isLoading}
                    />
                    <span className="ml-2">Kích hoạt</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh chính <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-sm p-6 text-center ${errors.product?.thumb ? "border-red-600" : "border-gray-300"}`}
                  >
                    {thumbPreview ? (
                      <div className="relative">
                        <img
                          src={thumbPreview || "/placeholder.svg"}
                          alt="Thumbnail"
                          className="mx-auto max-w-full max-h-48 object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setThumbPreview("")
                            setValue("product.thumb", null)
                            setValue("product.thumbUrl", "")
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <label htmlFor="thumb-upload" className="cursor-pointer">
                          <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                            Chọn ảnh
                          </span>
                          <input
                            id="thumb-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/gif"
                            onChange={handleThumbChange}
                            className="hidden"
                            disabled={isLoading}
                          />
                        </label>
                        <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB</div>
                      </div>
                    )}
                  </div>
                  {errors.product?.thumb && <p className="text-red-500 text-sm mt-1">{errors.product.thumb.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh nổi bật <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-sm p-6 text-center ${errors.product?.featuredImages ? "border-red-600" : "border-gray-300"}`}
                  >
                    <div className="mb-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <label htmlFor="featured-images-upload" className="cursor-pointer">
                        <span className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 inline-block">
                          Chọn nhiều ảnh
                        </span>
                        <input
                          id="featured-images-upload"
                          type="file"
                          accept="image/png,image/jpeg,image/gif"
                          multiple
                          onChange={handleFeaturedImageChange}
                          className="hidden"
                          disabled={isLoading}
                        />
                      </label>
                      <div className="text-gray-400 text-sm mt-2">PNG, JPG, GIF tối đa 10MB mỗi ảnh</div>
                    </div>
                    {featuredImagesPreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {featuredImagesPreviews.map(
                          (preview, index) =>
                            preview && (
                              <div key={index} className="relative">
                                <img
                                  src={preview || "/placeholder.svg"}
                                  alt={`Featured ${index}`}
                                  className="mx-auto max-w-full max-h-48 object-contain rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeaturedImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                                  disabled={isLoading}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ),
                        )}
                      </div>
                    )}
                  </div>
                  {errors.product?.featuredImages && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.featuredImages.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thông số kỹ thuật <span className="text-red-500">*</span>
                  </label>
                  {specificationsFields.map((field, index) => (
                    <SpecificationGroup
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      errors={errors}
                      isLoading={isLoading}
                      removeSpecification={removeSpecification}
                      specificationsFields={specificationsFields}
                    />
                  ))}
                  {errors.product?.specifications && (
                    <p className="text-red-500 text-sm mt-1">{errors.product.specifications.message}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => appendSpecification({ group: "", items: [{ label: "", value: "" }] })}
                    className="text-blue-500 hover:text-blue-600 flex items-center cursor-pointer"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Thêm nhóm thông số
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium mt-8 mb-4">
              Mục sản phẩm <span className="text-red-500">*</span>
            </h3>
            {errors.productItems && <p className="text-red-500 text-sm mb-4">{errors.productItems.message}</p>}
            {productItemsFields.map((item, itemIndex) => (
              <ProductItem
                key={item.id}
                itemIndex={itemIndex}
                control={control}
                register={register}
                errors={errors}
                isLoading={isLoading}
                removeProductItem={removeProductItem}
                productItemsPreviews={productItemsPreviews}
                setProductItemsPreviews={setProductItemsPreviews}
                handleProductItemThumbChange={handleProductItemThumbChange}
                handleProductItemImageChange={handleProductItemImageChange}
                setValue={setValue}
                setError={setError}
                clearErrors={clearErrors}
                productItemsFields={productItemsFields}
                suppliers={suppliers}
                branches={branches}
                featuredImagesDelete={featuredImagesDelete}
                setFeaturedImagesDelete={setFeaturedImagesDelete}
                productItemImagesDelete={productItemImagesDelete}
                setProductItemImagesDelete={setProductItemImagesDelete}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                appendProductItem({
                  name: "",
                  barcode: "",
                  thumb: null,
                  thumbUrl: "",
                  images: [],
                  attributes: [{ code: "", value: "" }],
                  status: "inactive",
                  retailPrice: "",
                  wholesalePrice: "",
                  supplier: "",
                  branch: "",
                })
                setProductItemsPreviews((prev) => [...prev, { thumb: "", images: [] }])
                clearErrors("productItems")
              }}
              className="text-blue-500 hover:text-blue-600 flex items-center mb-6 cursor-pointer"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm mục sản phẩm
            </button>

            {errors.form && <p className="text-red-500 text-sm mt-4">{errors.form.message}</p>}

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 cursor-pointer"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-pink-500 text-white rounded-sm hover:bg-pink-600 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    CẬP NHẬT
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UpdateProduct
