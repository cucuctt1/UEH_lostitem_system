import { useMemo, useState } from "react";
import { PostItem } from "../types";
import { PostViewerOverlay } from "./PostViewerOverlay";
import { resolveMediaUrl } from "../utils/media";

interface PostMediaGalleryProps {
  post: PostItem;
}

interface ImageDimensions {
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export function PostMediaGallery({ post }: PostMediaGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<Map<string, ImageDimensions>>(new Map());

  const images = useMemo(() => {
    const rawImages = Array.isArray(post.imageUrls) && post.imageUrls.length > 0
      ? post.imageUrls
      : post.imageUrl
        ? [post.imageUrl]
        : [];

    return rawImages
      .map((url) => resolveMediaUrl(url))
      .filter((url): url is string => Boolean(url));
  }, [post.imageUrls, post.imageUrl]);

  const handleImageLoad = (url: string, img: HTMLImageElement) => {
    const newDimensions = new Map(imageDimensions);
    newDimensions.set(url, {
      url,
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight
    });
    setImageDimensions(newDimensions);
  };

  if (images.length === 0) {
    return null;
  }

  const previewImages = images.slice(0, 4);
  const extraCount = Math.max(0, images.length - 4);

  return (
    <>
      <div className={`post-media-grid count-${previewImages.length}`}>
        {previewImages.map((imageUrl, index) => {
          const dims = imageDimensions.get(imageUrl);
          const aspectRatio = dims?.aspectRatio || 1;
          
          return (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              className={`post-media-cell ${index === 3 && extraCount > 0 ? "extra" : ""}`}
              onClick={() => {
                setStartIndex(index);
                setViewerOpen(true);
              }}
              style={{
                '--image-aspect-ratio': `${aspectRatio}` 
              } as React.CSSProperties & { '--image-aspect-ratio': string }}
            >
              <img
                src={imageUrl}
                alt={`${post.title} ${index + 1}`}
                className="post-media-image"
                loading="lazy"
                decoding="async"
                onLoad={(e) => handleImageLoad(imageUrl, e.currentTarget)}
              />
              {index === 3 && extraCount > 0 && <span className="post-media-extra">+{extraCount}</span>}
            </button>
          );
        })}
      </div>

      <PostViewerOverlay
        post={post}
        images={images}
        initialIndex={startIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
