for filename in *.png; do
	echo $filename
	name=${filename##*/}
	base=${name%.png}
	# convert to jpg with black background
	magick $filename  -background black -alpha remove ${base}_large.jpg 

	# compress jpg
	 magick ${base}_large.jpg -strip -interlace Plane -gaussian-blur 0.05 -quality 60% -resize 60% ${base}.jpg
done