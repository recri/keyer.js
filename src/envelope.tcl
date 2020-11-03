#!/usr/bin/wish

set rise 4
set fall 4
set m 1
set b 0.2
set envelope raised-cosine
set width 800
set height 200

pack [canvas .c -width $width -height $height] -side top -fill both -expand true

pack [ttk::labelframe .rise -text {rise(ms)}] -side top -fill x -expand true
pack [ttk::label .rise.l -textvar rise] -side left
pack [ttk::scale .rise.s -orient horizontal -from 0 -to 10 -variable rise -command [list plot rise]] -side left -fill x -expand true

pack [ttk::labelframe .fall -text {fall(ms)}] -side top -fill x -expand true
pack [ttk::label .fall.l -textvar fall] -side left
pack [ttk::scale .fall.s -orient horizontal -from 0 -to 10 -variable fall -command [list plot fall]] -side left -fill x -expand true

pack [ttk::labelframe .m -text {m param}] -side top -fill x -expand true
pack [ttk::label .m.l -textvar m] -side left
pack [ttk::scale .m.s -orient horizontal -from 0 -to 10 -variable m -command [list plot m]] -side left -fill x -expand true

pack [ttk::labelframe .b -text {b param}] -side top -fill x -expand true
pack [ttk::label .b.l -textvar b] -side left
pack [ttk::scale .b.s -orient horizontal -from 0 -to 1 -variable b -command [list plot b]] -side left -fill x -expand true

pack [ttk::labelframe .env -text envelope] -side top -fill x -expand true
grid [ttk::radiobutton .env.linear -text linear -variable envelope -value linear -command plot] -column 0 -row 0 -sticky ew 
grid [ttk::radiobutton .env.raised-cosine -text raised-cosine -variable envelope -value raised-cosine -command plot] -column 1 -row 0 -sticky ew
grid [ttk::radiobutton .env.exponential -text exponential -variable envelope -value exponential -command plot] -column 2 -row 0 -sticky ew
grid [ttk::radiobutton .env.off -text off -variable envelope -value off -command plot] -column 3 -row 0 -sticky ew
grid [ttk::radiobutton .env.on -text on -variable envelope -value on -command plot] -column 4 -row 0 -sticky ew

proc plot {args} {
    global rise fall m b envelope width height
    switch -glob $args {
	{rise *} { set rise [format %4.1f [lindex $args 1]] }
	{fall *} { set fall [format %4.1f [lindex $args 1]] }
	{b *} { set b [format %6.4f [lindex $args 1]] }
	{m *} { set m [format %6.4f [lindex $args 1]] }
	* { }
    }
    set y0 [expr {$height*0.9}]
    set y1 [expr {$height*0.1}]
    set yg [expr {$y0+10}]
    set ys [expr {$y0-$y1}]
    set x0 [expr {$width*0.1}]
    set x1 [expr {$width*0.9}]
    set xg [expr {$x0-10}]
    set t0 0
    set t1 [expr {1+$rise+4+$fall+1}]
    set xs [expr {($x1-$x0)/$t1}]
    
    # clear window
    .c delete all
    
    # x graticule
    set xy {}
    for {set t 0} {$t <= $t1} {incr t} {
	set xi [expr {$x0+$t*$xs}]
	lappend xy $xi $yg $xi [expr {$yg+10}] $xi $yg
    }
    .c create line $xy -fill black -width 2 -tag graticule

    # y graticule
    set xy {}
    for {set y 0} {$y <= 1} {set y [expr {$y+0.25}]} {
	set yi [expr {$y0-$y*$ys}]
	lappend xy $xg $yi [expr {$xg-10}] $yi $xg $yi
    }
    .c create line $xy -fill black -width 2 -tag graticule

    # envelope
    set xy {}
    for {set ti $t0} {$ti <= $t1} {set ti [expr {$ti+0.01}]} {
	set xi [expr {$x0+$ti*$xs}]
	if {$envelope eq {off}} {
	    lappend xy $xi $y0
	} elseif {$envelope eq {on}} {
	    lappend xy $xi $y1
	} elseif {$ti < 1} {
	    lappend xy $xi $y0;	# off before rise
	} elseif {$ti < 1+$rise} {
	    # rising
	    set p [expr {($ti-1)/$rise}]
	    switch $envelope {
		linear { set y $p }
		raised-cosine { set y [expr {(1+cos(3.14159+$p*3.14159))/2}] }
		exponential { set y [expr {$m*pow($p,$b)}] }
		default { set y 0 }
	    }
	    lappend xy $xi [expr {$y*$y1+(1-$y)*$y0}]
	} elseif {$ti < 1+$rise+4} {
	    lappend xy $xi $y1;	# on after rise
	} elseif {$ti < 1+$rise+4+$fall} {
	    # falling
	    set p [expr {($ti-(1+$rise+4))/$fall}]
	    switch $envelope {
		linear { set y [expr {1-$p}] }
		raised-cosine { set y [expr {(1+cos($p*3.14159))/2}] }
		exponential { set y [expr {1-$m*pow($p,$b)}] }
		default { set y 0 }
	    }
	    lappend xy $xi [expr {$y*$y1+(1-$y)*$y0}]
	} else {
	    lappend xy $xi $y0;	# off after fasll
	}
    }
    .c create line $xy -fill black -width 2 -tag envelope
}

plot
