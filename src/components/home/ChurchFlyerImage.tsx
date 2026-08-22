import Image from "next/image";

type ChurchFlyerImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

function isLocalImage(src: string) {
  return src.startsWith("/");
}

export function ChurchFlyerImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 512px) 50vw, 240px",
}: ChurchFlyerImageProps) {
  if (isLocalImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      decoding="async"
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
