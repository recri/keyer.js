#!/usr/bin/wish

set width 800
set height 200
set thick 0.20
set break1 0.30
set break2 0.70
set break3 0.80
set contact 0.10

pack [canvas .c -width 800 -height 400] -side top -fill both -expand true
foreach var {width height thick break1 break2 break3 contact} {
    pack [ttk::frame .$var] -side top
    pack [ttk::label .$var.l -text "$var: "] -side left
    pack [ttk::scale .$var.s -variable $var -orient horizontal -length 400] -side left
    pack [ttk::label .$var.v -textvar $var -width 5] -side left
    if {$var in {width height}} {
	.$var.s configure -from 100 -to 800
    } else {
	.$var.s configure -from 0 -to 1
    }
    .$var.s configure -command [list redraw $var]
}

proc redraw {args} {
    foreach {var val} $args {
	global $var
	if {$var in {width height}} {
	    set $var [format {%.0f} $val]
	} else {
	    set $var [format {%.2f} $val]
	}
    }

    # clean up
    .c delete all

    # scale proportions
    set t [expr {$::height*$::thick}]
    set t2 [expr {$t/2}]
    set b1 [expr {$::width*$::break1}]
    set b2 [expr {$::width*$::break2}]
    set b3 [expr {$::width*$::break3}]
    set c [expr {$::height*$::contact}]

    set yb [expr {$::height-$t2}]
    set yt $t2
    set ym [expr {$::height/2}]
    set xc [expr {($::width+$b3)/2}]
    set yc1 [expr {$ym+$t2+$c}]
    set yc2 [expr {$yb-$t2-$c}]

    # bottom line
    .c create line 0 $yb $::width $yb -width $t -fill blue

    # top line
    .c create line 0 $yt $b1 $yt $b2 $ym $::width $ym -width $t -fill blue

    # key handle
    .c create line $b3 $yt $::width $yt -width $t -fill blue

    # contacts
    .c create line $xc $yt $xc $yc1 -width $t -fill blue
    .c create line $xc $yb $xc $yc2 -width $t -fill blue
}

redraw

