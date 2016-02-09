module StopsHelper

  def isBikeStop(stop)
    if stop.stop_type == 2
      true
    else
      false
    end
  end

  def isCarStop(stop)
    if stop.stop_type == 3
      true
    else
      false
    end
  end

  def isZipcarStop(stop)
    if stop.stop_type == 6
      true
    else
      false
    end
  end

  def determineStopClass(stop)
    if isBikeStop(stop)
      'niceride'
    elsif isCarStop(stop)
      'car'
    elsif isZipcarStop(stop)
      'zipcar'
    end
  end

  def calculate_distance(stop)
    if (stop.sort[0].nil?)
      ""
    elsif (stop.sort[0]>2)
      stop.sort[0].round().to_s+" mi"      
    elsif(stop.sort[0]>0.5) then
      stop.sort[0].round(1).to_s+" mi"
    else
      (stop.sort[0]*5280).round().to_s+" ft"
    end
  end
end
