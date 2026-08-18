$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$width = 1024
$height = 500
$dest = Join-Path $PSScriptRoot "..\public\featured-graphic-1024x500.png"
$logoPath = Join-Path $PSScriptRoot "..\public\app-icon-512.png"

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-GradientText(
  [System.Drawing.Graphics]$g,
  [string]$text,
  [System.Drawing.Font]$font,
  [float]$x,
  [float]$y,
  [float]$maxWidth
) {
  $format = New-Object System.Drawing.StringFormat
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $size = $g.MeasureString($text, $font, $maxWidth, $format)
  $rect = New-Object System.Drawing.RectangleF $x, $y, $maxWidth, $size.Height
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::White,
    [System.Drawing.Color]::FromArgb(255, 224, 231, 255),
    35.0
  )
  $g.DrawString($text, $font, $brush, $rect, $format)
  $brush.Dispose()
  $format.Dispose()
  return $size.Height
}

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background gradient
$bgRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $bgRect,
  [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
  [System.Drawing.Color]::FromArgb(255, 49, 46, 129),
  135.0
)
$g.FillRectangle($bgBrush, $bgRect)
$bgBrush.Dispose()

function Draw-Glow([float]$cx, [float]$cy, [float]$rx, [float]$ry, [System.Drawing.Color]$color) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($cx - $rx, $cy - $ry, $rx * 2, $ry * 2)
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
  $brush.CenterColor = $color
  $brush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
  $g.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

Draw-Glow 180 110 170 120 ([System.Drawing.Color]::FromArgb(110, 251, 191, 36))
Draw-Glow 860 70 150 110 ([System.Drawing.Color]::FromArgb(120, 244, 114, 182))
Draw-Glow 760 430 180 130 ([System.Drawing.Color]::FromArgb(90, 56, 189, 248))
Draw-Glow 90 430 150 120 ([System.Drawing.Color]::FromArgb(100, 167, 139, 250))

# Left content
$logo = [System.Drawing.Image]::FromFile($logoPath)
$logoSize = 92
$logoX = 56
$logoY = 118
$logoPathShape = New-RoundedRectPath -x $logoX -y $logoY -w $logoSize -h $logoSize -r 14
$g.SetClip($logoPathShape)
$g.DrawImage($logo, $logoX, $logoY, $logoSize, $logoSize)
$g.ResetClip()
$logoPathShape.Dispose()

$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 255, 255, 255)), 2
$g.DrawPath($pen, (New-RoundedRectPath -x $logoX -y $logoY -w $logoSize -h $logoSize -r 14))
$pen.Dispose()

$titleFont = [System.Drawing.Font]::new("Georgia", 34, [System.Drawing.FontStyle]::Bold)
$subFont = [System.Drawing.Font]::new("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
$headlineFont = [System.Drawing.Font]::new("Georgia", 40, [System.Drawing.FontStyle]::Bold)
$pillFont = [System.Drawing.Font]::new("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)

$white = [System.Drawing.Brushes]::White
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(165, 255, 255, 255))

$g.DrawString("Shanah City", $titleFont, $white, 168, 122)
$g.DrawString("Aurora · Accra · Online", $subFont, $muted, 168, 168)

$headlineHeight = Draw-GradientText $g "Changing Lives To Higher Levels In God." $headlineFont 56 228 520

$pillY = 228 + $headlineHeight + 18
$pillRect = New-Object System.Drawing.RectangleF 56, $pillY, 360, 42
$pillPath = New-RoundedRectPath -x 56 -y $pillY -w 360 -h 42 -r 21
$pillFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(38, 255, 255, 255))
$g.FillPath($pillFill, $pillPath)
$pillPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(38, 255, 255, 255)), 1
$g.DrawPath($pillPen, $pillPath)
$pillGold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 254, 243, 199))
$g.DrawString("Watch live · Devotions · Community", $pillFont, $pillGold, 74, ($pillY + 10))

# Phone mockup
$phoneX = 690
$phoneY = 58
$phoneW = 270
$phoneH = 384
$phoneOuter = New-RoundedRectPath -x $phoneX -y $phoneY -w $phoneW -h $phoneH -r 34
$phoneOuterBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle $phoneX, $phoneY, $phoneW, $phoneH),
  [System.Drawing.Color]::FromArgb(56, 255, 255, 255),
  [System.Drawing.Color]::FromArgb(20, 255, 255, 255),
  90.0
)
$g.FillPath($phoneOuterBrush, $phoneOuter)
$phoneOuterBrush.Dispose()

$screenX = $phoneX + 12
$screenY = $phoneY + 12
$screenW = $phoneW - 24
$screenH = $phoneH - 24
$screenPath = New-RoundedRectPath -x $screenX -y $screenY -w $screenW -h $screenH -r 26
$screenBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 248, 245))
$g.FillPath($screenBg, $screenPath)
$screenBg.Dispose()

$miniHeroH = 170
$miniHeroRect = New-Object System.Drawing.Rectangle $screenX, $screenY, $screenW, $miniHeroH
$miniHeroBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $miniHeroRect,
  [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
  [System.Drawing.Color]::FromArgb(255, 49, 46, 129),
  135.0
)
$g.FillRectangle($miniHeroBrush, $miniHeroRect)
$miniHeroBrush.Dispose()

Draw-Glow ($screenX + 50) ($screenY + 40) 50 40 ([System.Drawing.Color]::FromArgb(90, 251, 191, 36))
Draw-Glow ($screenX + $screenW - 50) ($screenY + 30) 45 35 ([System.Drawing.Color]::FromArgb(100, 244, 114, 182))

$miniTitleFont = [System.Drawing.Font]::new("Georgia", 13, [System.Drawing.FontStyle]::Bold)
$miniHeadlineFont = [System.Drawing.Font]::new("Georgia", 17, [System.Drawing.FontStyle]::Bold)
$miniLabelFont = [System.Drawing.Font]::new("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)

$g.DrawString("Shanah City", $miniTitleFont, $white, ($screenX + 16), ($screenY + 18))
Draw-GradientText $g "Changing Lives To Higher Levels In God." $miniHeadlineFont ($screenX + 16) ($screenY + 42) ($screenW - 32) | Out-Null

$liveX = $screenX + 14
$liveY = $screenY + 98
$liveW = $screenW - 28
$liveH = 58
$livePath = New-RoundedRectPath -x $liveX -y $liveY -w $liveW -h $liveH -r 16
$liveBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle $liveX, $liveY, $liveW, $liveH),
  [System.Drawing.Color]::FromArgb(255, 225, 29, 72),
  [System.Drawing.Color]::FromArgb(255, 76, 29, 149),
  90.0
)
$g.FillPath($liveBrush, $livePath)
$liveBrush.Dispose()
$g.DrawString("MEDIA", $miniLabelFont, $white, ($liveX + 12), ($liveY + 10))
$g.DrawString("Watch live worship", $miniHeadlineFont, $white, ($liveX + 12), ($liveY + 26))

$cardFont = [System.Drawing.Font]::new("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$cards = @(
  @{ Label = "Give"; X = 0; Y = 0; C1 = [System.Drawing.Color]::FromArgb(255, 124, 58, 237); C2 = [System.Drawing.Color]::FromArgb(255, 192, 38, 211) },
  @{ Label = "Connect"; X = 1; Y = 0; C1 = [System.Drawing.Color]::FromArgb(255, 14, 165, 233); C2 = [System.Drawing.Color]::FromArgb(255, 67, 56, 202) },
  @{ Label = "Community"; X = 0; Y = 1; C1 = [System.Drawing.Color]::FromArgb(255, 16, 185, 129); C2 = [System.Drawing.Color]::FromArgb(255, 8, 145, 178) },
  @{ Label = "Devotions"; X = 1; Y = 1; C1 = [System.Drawing.Color]::FromArgb(255, 245, 158, 11); C2 = [System.Drawing.Color]::FromArgb(255, 225, 29, 72) }
)

$gridX = $screenX + 10
$gridY = $screenY + $miniHeroH + 10
$cellW = [math]::Floor(($screenW - 30) / 2)
$cellH = 74
$gap = 10

foreach ($card in $cards) {
  $cx = $gridX + ($card.X * ($cellW + $gap))
  $cy = $gridY + ($card.Y * ($cellH + $gap))
  $cardPath = New-RoundedRectPath -x $cx -y $cy -w $cellW -h $cellH -r 14
  $cardBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle $cx, $cy, $cellW, $cellH),
    $card.C1,
    $card.C2,
    45.0
  )
  $g.FillPath($cardBrush, $cardPath)
  $cardBrush.Dispose()
  $g.DrawString($card.Label, $cardFont, $white, ($cx + 12), ($cy + 26))
}

$bitmap.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)

$titleFont.Dispose()
$subFont.Dispose()
$headlineFont.Dispose()
$pillFont.Dispose()
$miniTitleFont.Dispose()
$miniHeadlineFont.Dispose()
$miniLabelFont.Dispose()
$cardFont.Dispose()
$muted.Dispose()
$pillFill.Dispose()
$pillPen.Dispose()
$pillPath.Dispose()
$phoneOuter.Dispose()
$screenPath.Dispose()
$livePath.Dispose()
$logo.Dispose()
$g.Dispose()
$bitmap.Dispose()

$info = Get-Item $dest
Write-Output "Created: $dest"
Write-Output "Size: 1024x500"
Write-Output "Bytes: $($info.Length)"
